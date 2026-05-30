"""
FinTrack — Voucher Template serializers.

Accepts account as id OR name (the frontend templates reference accounts by
name, e.g. "Cash in Hand"); both resolve to the real Account FK.
"""
from rest_framework import serializers
from decimal import Decimal

from accounts.models import Account
from .models import VoucherTemplate, VoucherTemplateLine, TemplateType, TemplateFrequency


# ── account field that accepts id or name ──────────────────────────
class AccountByIdOrName(serializers.Field):
    def to_representation(self, value):
        # value is an Account instance
        return value.id

    def to_internal_value(self, data):
        acct = None
        if isinstance(data, int) or (isinstance(data, str) and data.isdigit()):
            acct = Account.objects.filter(pk=int(data)).first()
        if acct is None and isinstance(data, str):
            acct = Account.objects.filter(name__iexact=data.strip()).first()
        if acct is None:
            raise serializers.ValidationError(f'Account not found: {data!r}')
        return acct


# ── template line ──────────────────────────────────────────────────
class TemplateLineSerializer(serializers.ModelSerializer):
    account      = AccountByIdOrName()
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model  = VoucherTemplateLine
        fields = ['id', 'account', 'account_name', 'side', 'description',
                  'default_amount', 'sort_order']
        read_only_fields = ['id', 'account_name']


# ── template (read + write) ────────────────────────────────────────
class VoucherTemplateSerializer(serializers.ModelSerializer):
    lines        = TemplateLineSerializer(many=True)
    v_type_label = serializers.CharField(source='get_v_type_display', read_only=True)
    total_debit  = serializers.SerializerMethodField()
    total_credit = serializers.SerializerMethodField()
    is_balanced  = serializers.BooleanField(read_only=True)

    class Meta:
        model  = VoucherTemplate
        fields = [
            'id', 'name', 'v_type', 'v_type_label', 'description', 'tag',
            'default_amount', 'is_recurring', 'frequency',
            'is_active', 'lines',
            'total_debit', 'total_credit', 'is_balanced',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'v_type_label', 'total_debit', 'total_credit',
                            'is_balanced', 'created_at', 'updated_at']

    def get_total_debit(self, obj):
        return str(obj.total_debit)

    def get_total_credit(self, obj):
        return str(obj.total_credit)

    def validate_lines(self, value):
        if len(value) < 2:
            raise serializers.ValidationError('A template needs at least two lines.')
        sides = {l['side'] for l in value}
        if 'debit' not in sides or 'credit' not in sides:
            raise serializers.ValidationError('A template needs at least one debit and one credit line.')
        return value

    def create(self, validated_data):
        lines = validated_data.pop('lines', [])
        template = VoucherTemplate.objects.create(**validated_data)
        for i, ln in enumerate(lines):
            VoucherTemplateLine.objects.create(template=template, sort_order=ln.get('sort_order', i), **{
                k: v for k, v in ln.items() if k != 'sort_order'
            })
        return template

    def update(self, instance, validated_data):
        lines = validated_data.pop('lines', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if lines is not None:
            instance.lines.all().delete()
            for i, ln in enumerate(lines):
                VoucherTemplateLine.objects.create(template=instance, sort_order=ln.get('sort_order', i), **{
                    k: v for k, v in ln.items() if k != 'sort_order'
                })
        return instance


# ── apply input ────────────────────────────────────────────────────
class ApplyTemplateSerializer(serializers.Serializer):
    """Validates the overrides sent when applying a template."""
    amount      = serializers.DecimalField(max_digits=18, decimal_places=2,
                                            min_value=Decimal('0.01'))
    date        = serializers.DateField()
    description = serializers.CharField(max_length=500, required=False, allow_blank=True)
    reference   = serializers.CharField(max_length=100, required=False, allow_blank=True)
    post        = serializers.BooleanField(required=False, default=True)
    recurring   = serializers.BooleanField(required=False, default=False)
    frequency   = serializers.ChoiceField(choices=TemplateFrequency.choices,
                                          required=False, allow_blank=True)
    created_by  = serializers.IntegerField(required=False, allow_null=True)
