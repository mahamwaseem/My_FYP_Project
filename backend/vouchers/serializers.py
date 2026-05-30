"""
FinTrack – Voucher Serializers
serializers.py  ──  VERSION 3.0  (Integrated with real COA)

Changes from v2:
  ✅ account_id field replaced with account (FK to accounts.Account)
  ✅ account_name shown in read responses (no extra query — select_related)
  ✅ Validation checks against real Account objects instead of raw integers
"""

from rest_framework import serializers
from django.db import transaction
from decimal import Decimal, ROUND_HALF_UP

from .models import (
    VoucherHeader, VoucherDetail, Currency,
    VoucherStatus, VoucherAuditLog, RecurringSchedule,
)
from accounts.models import Account


# ── helpers ───────────────────────────────────────────────────────

ZERO = Decimal('0.00')

def _quantize(value):
    return Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def _log(voucher, action, performed_by=None, notes=''):
    VoucherAuditLog.objects.create(
        voucher      = voucher,
        action       = action,
        performed_by = performed_by,
        notes        = notes,
        snapshot     = {
            'voucher_no'  : voucher.voucher_no,
            'status'      : voucher.status,
            'total_debit' : str(voucher.total_debit),
            'total_credit': str(voucher.total_credit),
            'date'        : str(voucher.date),
        }
    )


# ══════════════════════════════════════════════
# Currency
# ══════════════════════════════════════════════

class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Currency
        fields = ['id', 'code', 'name', 'symbol', 'exchange_rate', 'is_base', 'is_active']
        read_only_fields = ['id']

    def validate_code(self, value):
        return value.upper().strip()

    def validate_exchange_rate(self, value):
        if value <= 0:
            raise serializers.ValidationError('Exchange rate must be greater than zero.')
        return value


# ══════════════════════════════════════════════
# Voucher Detail  (line items)
# ══════════════════════════════════════════════

class VoucherDetailSerializer(serializers.ModelSerializer):
    # Write: accept account PK
    account = serializers.PrimaryKeyRelatedField(queryset=Account.objects.filter(is_active=True))
    # Read: also return account name and group path for display
    account_name     = serializers.CharField(source='account.name',                           read_only=True)
    account_class    = serializers.CharField(source='account.account_class.name',             read_only=True)
    account_category = serializers.CharField(source='account.account_class.category.name',    read_only=True)
    account_group    = serializers.CharField(source='account.account_class.category.group.name', read_only=True)

    class Meta:
        model  = VoucherDetail
        fields = [
            'id',
            'account', 'account_name', 'account_class',
            'account_category', 'account_group',
            'description',
            'debit', 'credit',
            'currency', 'amount_fc',
            'cost_center', 'sort_order',
        ]
        read_only_fields = ['id', 'account_name', 'account_class',
                            'account_category', 'account_group']

    def validate_description(self, value):
        return value.strip()

    def validate(self, data):
        debit  = _quantize(data.get('debit',  ZERO))
        credit = _quantize(data.get('credit', ZERO))

        if debit < ZERO or credit < ZERO:
            raise serializers.ValidationError('Debit and Credit amounts cannot be negative.')
        if debit > ZERO and credit > ZERO:
            raise serializers.ValidationError(
                'A single line cannot have both a Debit AND a Credit amount. '
                'Use separate lines for each side.'
            )
        if debit == ZERO and credit == ZERO:
            raise serializers.ValidationError(
                'Each line must have a non-zero Debit OR Credit amount.'
            )
        data['debit']  = debit
        data['credit'] = credit
        return data


# ══════════════════════════════════════════════
# Voucher Header – READ  (full detail view)
# ══════════════════════════════════════════════

class VoucherHeaderReadSerializer(serializers.ModelSerializer):
    lines         = VoucherDetailSerializer(many=True, read_only=True)
    total_debit   = serializers.SerializerMethodField()
    total_credit  = serializers.SerializerMethodField()
    is_balanced   = serializers.SerializerMethodField()
    difference    = serializers.SerializerMethodField()
    v_type_label  = serializers.CharField(source='get_v_type_display',  read_only=True)
    status_label  = serializers.CharField(source='get_status_display',  read_only=True)
    currency_code = serializers.CharField(source='currency.code', read_only=True, default=None)
    line_count    = serializers.SerializerMethodField()

    class Meta:
        model  = VoucherHeader
        fields = [
            'id', 'voucher_no',
            'v_type', 'v_type_label',
            'date', 'reference', 'narration',
            'status', 'status_label',
            'currency', 'currency_code', 'exchange_rate',
            'is_reversal', 'reversed_voucher',
            'is_recurring', 'recurring_frequency',
            'recurring_end_date', 'next_due_date',
            'total_debit', 'total_credit',
            'is_balanced', 'difference', 'line_count',
            'created_by', 'approved_by',
            'created_at', 'updated_at', 'posted_at',
            'lines',
        ]

    def get_total_debit(self, obj):   return str(obj.total_debit)
    def get_total_credit(self, obj):  return str(obj.total_credit)
    def get_is_balanced(self, obj):   return obj.is_balanced
    def get_difference(self, obj):    return str(obj.difference)
    def get_line_count(self, obj):    return obj.lines.count()


# ══════════════════════════════════════════════
# Voucher Header – WRITE  (create / update)
# ══════════════════════════════════════════════

class VoucherHeaderWriteSerializer(serializers.ModelSerializer):
    lines = VoucherDetailSerializer(many=True)

    class Meta:
        model  = VoucherHeader
        fields = [
            'id', 'v_type', 'date', 'reference', 'narration',
            'currency', 'exchange_rate',
            'is_recurring', 'recurring_frequency',
            'recurring_end_date', 'next_due_date',
            'created_by',
            'lines',
        ]
        read_only_fields = ['id']

    def validate_reference(self, value):    return value.strip()
    def validate_narration(self, value):    return value.strip()

    def validate_exchange_rate(self, value):
        if value <= 0:
            raise serializers.ValidationError('Exchange rate must be greater than zero.')
        return value

    def validate(self, data):
        lines = data.get('lines', [])
        if len(lines) < 2:
            raise serializers.ValidationError({
                'lines': 'A voucher requires at least 2 lines (double-entry: one debit, one credit).'
            })

        total_debit  = sum(_quantize(l.get('debit',  ZERO)) for l in lines)
        total_credit = sum(_quantize(l.get('credit', ZERO)) for l in lines)

        if total_debit != total_credit:
            diff = abs(total_debit - total_credit)
            raise serializers.ValidationError({
                'lines': (
                    f'Voucher is NOT balanced. '
                    f'Total Debit = {total_debit}, Total Credit = {total_credit}, '
                    f'Difference = {diff}. Every voucher must satisfy: Σ Debit = Σ Credit.'
                )
            })
        if total_debit == ZERO:
            raise serializers.ValidationError({'lines': 'Voucher totals cannot be zero.'})
        if data.get('is_recurring') and not data.get('recurring_frequency'):
            raise serializers.ValidationError({
                'recurring_frequency': 'Frequency is required when Is Recurring is checked.'
            })
        return data

    @transaction.atomic
    def create(self, validated_data):
        lines_data = validated_data.pop('lines')
        header     = VoucherHeader.objects.create(**validated_data)
        for i, line_data in enumerate(lines_data):
            VoucherDetail.objects.create(header=header, sort_order=i, **line_data)
        if header.is_recurring and header.recurring_frequency:
            RecurringSchedule.objects.create(
                template_voucher = header,
                frequency        = header.recurring_frequency,
                start_date       = header.date,
                end_date         = header.recurring_end_date,
                next_due_date    = header.next_due_date or header.date,
            )
        _log(header, VoucherAuditLog.Action.CREATED,
             performed_by=header.created_by, notes='Voucher created as DRAFT.')
        return header

    @transaction.atomic
    def update(self, instance, validated_data):
        if instance.status != VoucherStatus.DRAFT:
            raise serializers.ValidationError(
                'Only DRAFT vouchers can be edited. '
                'For posted vouchers, create a reversal instead.'
            )
        lines_data = validated_data.pop('lines', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lines_data is not None:
            instance.lines.all().delete()
            for i, line_data in enumerate(lines_data):
                VoucherDetail.objects.create(header=instance, sort_order=i, **line_data)
        _log(instance, VoucherAuditLog.Action.UPDATED,
             performed_by=validated_data.get('created_by'), notes='Voucher lines updated.')
        return instance


# ══════════════════════════════════════════════
# Voucher Header – LIST  (paginated, no lines)
# ══════════════════════════════════════════════

class VoucherHeaderListSerializer(serializers.ModelSerializer):
    total_debit  = serializers.SerializerMethodField()
    total_credit = serializers.SerializerMethodField()
    is_balanced  = serializers.SerializerMethodField()
    v_type_label = serializers.CharField(source='get_v_type_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = VoucherHeader
        fields = [
            'id', 'voucher_no',
            'v_type', 'v_type_label',
            'date', 'reference', 'narration',
            'status', 'status_label',
            'total_debit', 'total_credit', 'is_balanced',
            'is_recurring', 'created_at',
        ]

    def get_total_debit(self, obj):   return str(obj.total_debit)
    def get_total_credit(self, obj):  return str(obj.total_credit)
    def get_is_balanced(self, obj):   return obj.is_balanced


# ══════════════════════════════════════════════
# Audit Log  (read-only)
# ══════════════════════════════════════════════

class VoucherAuditLogSerializer(serializers.ModelSerializer):
    action_label = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model  = VoucherAuditLog
        fields = ['id', 'action', 'action_label', 'performed_by', 'timestamp', 'notes', 'snapshot']
        read_only_fields = fields


# ══════════════════════════════════════════════
# Recurring Schedule
# ══════════════════════════════════════════════

class RecurringScheduleSerializer(serializers.ModelSerializer):
    """
    Read/write serializer for a recurring schedule.
    Surfaces helpful read-only fields from the linked template voucher so the
    frontend Recurring view can render without extra lookups.
    """
    template_voucher_no = serializers.CharField(source='template_voucher.voucher_no', read_only=True)
    v_type              = serializers.CharField(source='template_voucher.v_type',      read_only=True)
    narration           = serializers.CharField(source='template_voucher.narration',   read_only=True, default='')
    frequency_label     = serializers.CharField(source='get_frequency_display',        read_only=True)
    total_amount        = serializers.SerializerMethodField()

    class Meta:
        model  = RecurringSchedule
        fields = [
            'id', 'template_voucher', 'template_voucher_no', 'v_type', 'narration',
            'frequency', 'frequency_label', 'start_date', 'end_date',
            'next_due_date', 'last_generated', 'times_generated',
            'is_active', 'total_amount',
        ]
        read_only_fields = ['id', 'last_generated', 'times_generated',
                            'template_voucher_no', 'v_type', 'narration',
                            'frequency_label', 'total_amount']

    def get_total_amount(self, obj):
        """Sum of debits on the template voucher (the recurring amount)."""
        total = sum((l.debit or ZERO) for l in obj.template_voucher.lines.all())
        return str(total)

    def validate(self, attrs):
        start = attrs.get('start_date')
        end   = attrs.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError('End date cannot be before the start date.')
        # default next_due_date to start_date on create if omitted
        if not self.instance and not attrs.get('next_due_date'):
            attrs['next_due_date'] = start
        return attrs