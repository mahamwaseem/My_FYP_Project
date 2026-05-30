"""
FinTrack - Voucher Management Module
models.py  ──  VERSION 3.0  (Integrated with real COA)

Changes from v2:
  ✅ VoucherDetail.account_id (IntegerField) replaced with
     VoucherDetail.account (ForeignKey → accounts.Account)
  ✅ create_reversal() updated to use account FK correctly
  ✅ All other logic unchanged
"""

from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, MinValueValidator
from django.utils import timezone
from decimal import Decimal
from dateutil.relativedelta import relativedelta


# ── Shared validator ───────────────────────────────────────────────
safe_text = RegexValidator(
    regex=r'^[^<>{}\"\\]*$',
    message="Characters < > { } ' \" \\ are not allowed."
)


# ── Choices ────────────────────────────────────────────────────────

class VoucherType(models.TextChoices):
    PAYMENT = 'PV', 'Payment Voucher'
    RECEIPT = 'RV', 'Receipt Voucher'
    JOURNAL = 'JV', 'Journal Voucher'


class VoucherStatus(models.TextChoices):
    DRAFT    = 'DRAFT',    'Draft'
    POSTED   = 'POSTED',   'Posted'
    REVERSED = 'REVERSED', 'Reversed'


class RecurringFrequency(models.TextChoices):
    DAILY     = 'DAILY',     'Daily'
    WEEKLY    = 'WEEKLY',    'Weekly'
    MONTHLY   = 'MONTHLY',   'Monthly'
    QUARTERLY = 'QUARTERLY', 'Quarterly'
    YEARLY    = 'YEARLY',    'Yearly'


# ══════════════════════════════════════════════
# Currency Master
# ══════════════════════════════════════════════

class Currency(models.Model):
    code          = models.CharField(max_length=3, unique=True, validators=[safe_text])
    name          = models.CharField(max_length=60, validators=[safe_text])
    symbol        = models.CharField(max_length=5)
    exchange_rate = models.DecimalField(
                        max_digits=18, decimal_places=6,
                        default=Decimal('1.000000'),
                        validators=[MinValueValidator(Decimal('0.000001'))],
                        help_text='How many base-currency units = 1 of this currency')
    is_base       = models.BooleanField(default=False)
    is_active     = models.BooleanField(default=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table            = 'fin_currency'
        verbose_name_plural = 'Currencies'
        ordering            = ['code']

    def __str__(self):
        return f'{self.code} – {self.name}'

    def clean(self):
        if self.is_base and self.exchange_rate != Decimal('1.000000'):
            raise ValidationError('Base currency must have exchange_rate = 1.000000')
        if self.is_base:
            qs = Currency.objects.filter(is_base=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError(
                    'Another base currency already exists. Only one currency can be the base.'
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# ══════════════════════════════════════════════
# Voucher Header
# ══════════════════════════════════════════════

class VoucherHeader(models.Model):
    voucher_no  = models.CharField(max_length=20, unique=True, editable=False,
                                   help_text='Auto-generated. Format: PV-2025-00001')
    v_type      = models.CharField(max_length=2, choices=VoucherType.choices)
    date        = models.DateField(default=timezone.now)
    reference   = models.CharField(max_length=100, blank=True, validators=[safe_text],
                                   help_text='Cheque no / Invoice no / Reference doc')
    narration   = models.TextField(blank=True, validators=[safe_text],
                                   help_text='Overall description of this transaction')
    status      = models.CharField(max_length=10, choices=VoucherStatus.choices,
                                   default=VoucherStatus.DRAFT)

    currency      = models.ForeignKey(Currency, on_delete=models.PROTECT,
                                      null=True, blank=True,
                                      help_text='Leave blank to use base currency')
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=6,
                                        default=Decimal('1.000000'),
                                        validators=[MinValueValidator(Decimal('0.000001'))])

    is_reversal      = models.BooleanField(default=False)
    reversed_voucher = models.ForeignKey(
                           'self', null=True, blank=True,
                           on_delete=models.SET_NULL,
                           related_name='reversal_entries',
                           help_text='Original voucher this entry reverses')

    is_recurring        = models.BooleanField(default=False)
    recurring_frequency = models.CharField(max_length=10,
                                            choices=RecurringFrequency.choices, blank=True)
    recurring_end_date  = models.DateField(null=True, blank=True)
    next_due_date       = models.DateField(null=True, blank=True)
    recurring_parent    = models.ForeignKey('self', null=True, blank=True,
                                             on_delete=models.SET_NULL,
                                             related_name='recurring_children')

    is_active   = models.BooleanField(default=True)
    created_by  = models.IntegerField(null=True, blank=True,
                                      help_text='Placeholder → swap for FK to auth.User when ready')
    approved_by = models.IntegerField(null=True, blank=True,
                                      help_text='Placeholder → swap for FK to auth.User when ready')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    posted_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'fin_voucher_header'
        ordering = ['-date', '-created_at']
        indexes  = [
            models.Index(fields=['date'],           name='idx_vh_date'),
            models.Index(fields=['v_type'],          name='idx_vh_vtype'),
            models.Index(fields=['status'],          name='idx_vh_status'),
            models.Index(fields=['date', 'v_type'],  name='idx_vh_date_vtype'),
            models.Index(fields=['date', 'status'],  name='idx_vh_date_status'),
            models.Index(fields=['is_active'],       name='idx_vh_active'),
        ]

    def __str__(self):
        return f'{self.voucher_no} | {self.get_v_type_display()} | {self.date}'

    def _generate_voucher_no(self):
        prefix_map = {
            VoucherType.PAYMENT: 'PV',
            VoucherType.RECEIPT: 'RV',
            VoucherType.JOURNAL: 'JV',
        }
        prefix = prefix_map.get(self.v_type, 'VCH')
        year   = self.date.year if self.date else timezone.now().year
        with transaction.atomic():
            count = (
                VoucherHeader.objects
                .select_for_update()
                .filter(v_type=self.v_type, date__year=year)
                .count()
            ) + 1
        return f'{prefix}-{year}-{count:05d}'

    def save(self, *args, **kwargs):
        if not self.voucher_no:
            self.voucher_no = self._generate_voucher_no()
        super().save(*args, **kwargs)

    @property
    def total_debit(self):
        result = self.lines.aggregate(total=models.Sum('debit'))['total']
        return result or Decimal('0.00')

    @property
    def total_credit(self):
        result = self.lines.aggregate(total=models.Sum('credit'))['total']
        return result or Decimal('0.00')

    @property
    def is_balanced(self):
        return self.total_debit == self.total_credit

    @property
    def difference(self):
        return abs(self.total_debit - self.total_credit)

    def validate_balance(self):
        if not self.is_balanced:
            raise ValidationError(
                f'Voucher is NOT balanced. '
                f'Debit = {self.total_debit}, Credit = {self.total_credit}, '
                f'Difference = {self.difference}. '
                'Every voucher must satisfy: Total Debit = Total Credit.'
            )

    def validate_lines(self):
        if not self.lines.exists():
            raise ValidationError('A voucher must have at least two transaction lines.')
        if self.lines.count() < 2:
            raise ValidationError('Double-entry requires a minimum of two lines.')

    def post(self, posted_by_id=None):
        if self.status != VoucherStatus.DRAFT:
            raise ValidationError(
                f'Only DRAFT vouchers can be posted. Current status: {self.status}'
            )
        self.validate_lines()
        self.validate_balance()
        self.status    = VoucherStatus.POSTED
        self.posted_at = timezone.now()
        if posted_by_id:
            self.approved_by = posted_by_id
        self.save()

    def create_reversal(self, reversal_date=None, created_by_id=None):
        if self.status != VoucherStatus.POSTED:
            raise ValidationError('Only POSTED vouchers can be reversed.')
        if self.reversal_entries.exists():
            raise ValidationError(f'Voucher {self.voucher_no} has already been reversed.')

        from datetime import date as date_type
        if reversal_date and isinstance(reversal_date, str):
            from datetime import datetime
            reversal_date = datetime.strptime(reversal_date, '%Y-%m-%d').date()
        actual_date = reversal_date or timezone.now().date()

        with transaction.atomic():
            reversal = VoucherHeader.objects.create(
                v_type           = self.v_type,
                date             = actual_date,
                reference        = f'REV-{self.voucher_no}',
                narration        = f'Reversal of {self.voucher_no}: {self.narration}',
                status           = VoucherStatus.DRAFT,
                currency         = self.currency,
                exchange_rate    = self.exchange_rate,
                is_reversal      = True,
                reversed_voucher = self,
                created_by       = created_by_id,
            )
            for line in self.lines.all():
                VoucherDetail.objects.create(
                    header      = reversal,
                    account     = line.account,      # ✅ FK — pass the Account object
                    description = f'[REV] {line.description}',
                    debit       = line.credit,        # swapped
                    credit      = line.debit,         # swapped
                    currency    = line.currency,
                    amount_fc   = line.amount_fc,
                    cost_center = line.cost_center,
                )

        self.status = VoucherStatus.REVERSED
        self.save()
        return reversal


# ══════════════════════════════════════════════
# Voucher Detail  (line items)
# ══════════════════════════════════════════════

class VoucherDetail(models.Model):
    header  = models.ForeignKey(VoucherHeader, on_delete=models.CASCADE,
                                 related_name='lines')

    # ✅ REAL COA FK — replaces the dummy IntegerField account_id
    account = models.ForeignKey(
                  'accounts.Account',
                  on_delete=models.PROTECT,
                  related_name='voucher_lines',
                  help_text='Select from Chart of Accounts')

    description = models.CharField(max_length=255, blank=True, validators=[safe_text])
    debit       = models.DecimalField(max_digits=18, decimal_places=2,
                                      default=Decimal('0.00'),
                                      validators=[MinValueValidator(Decimal('0.00'))])
    credit      = models.DecimalField(max_digits=18, decimal_places=2,
                                      default=Decimal('0.00'),
                                      validators=[MinValueValidator(Decimal('0.00'))])
    currency    = models.ForeignKey(Currency, null=True, blank=True,
                                    on_delete=models.PROTECT,
                                    help_text='Original currency before conversion to base')
    amount_fc   = models.DecimalField(max_digits=18, decimal_places=2,
                                      null=True, blank=True,
                                      help_text='Amount in foreign currency before conversion')
    cost_center = models.CharField(max_length=50, blank=True, validators=[safe_text],
                                   help_text='Optional cost center for management reporting')
    sort_order  = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'fin_voucher_detail'
        ordering = ['sort_order', 'id']
        indexes  = [
            models.Index(fields=['account'],          name='idx_vd_account'),
            models.Index(fields=['account', 'header'], name='idx_vd_account_header'),
        ]

    def __str__(self):
        side = f'Dr {self.debit}' if self.debit else f'Cr {self.credit}'
        return f'{self.header.voucher_no} | {self.account} | {side}'

    def clean(self):
        debit  = self.debit  or Decimal('0.00')
        credit = self.credit or Decimal('0.00')
        if debit < 0 or credit < 0:
            raise ValidationError('Debit and Credit values cannot be negative.')
        if debit > 0 and credit > 0:
            raise ValidationError(
                'A single line cannot have BOTH a Debit and a Credit amount. '
                'Split into two separate lines.'
            )
        if debit == 0 and credit == 0:
            raise ValidationError(
                'Each line must have either a Debit OR a Credit amount (not both zero).'
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# ══════════════════════════════════════════════
# Recurring Schedule
# ══════════════════════════════════════════════

class RecurringSchedule(models.Model):
    template_voucher = models.OneToOneField(VoucherHeader, on_delete=models.CASCADE,
                                             related_name='schedule')
    frequency        = models.CharField(max_length=10, choices=RecurringFrequency.choices)
    start_date       = models.DateField()
    end_date         = models.DateField(null=True, blank=True)
    next_due_date    = models.DateField()
    last_generated   = models.DateField(null=True, blank=True)
    times_generated  = models.PositiveIntegerField(default=0)
    is_active        = models.BooleanField(default=True)

    class Meta:
        db_table = 'fin_recurring_schedule'
        indexes  = [
            models.Index(fields=['next_due_date', 'is_active'], name='idx_rs_due_active'),
        ]

    def __str__(self):
        return (f'Schedule({self.template_voucher.voucher_no}, '
                f'{self.frequency}, next: {self.next_due_date})')

    def advance_due_date(self):
        freq    = self.frequency
        current = self.next_due_date
        if freq == RecurringFrequency.DAILY:
            from datetime import timedelta
            self.next_due_date = current + timedelta(days=1)
        elif freq == RecurringFrequency.WEEKLY:
            from datetime import timedelta
            self.next_due_date = current + timedelta(weeks=1)
        elif freq == RecurringFrequency.MONTHLY:
            self.next_due_date = current + relativedelta(months=1)
        elif freq == RecurringFrequency.QUARTERLY:
            self.next_due_date = current + relativedelta(months=3)
        elif freq == RecurringFrequency.YEARLY:
            self.next_due_date = current + relativedelta(years=1)
        if self.end_date and self.next_due_date > self.end_date:
            self.is_active = False
        self.last_generated   = current
        self.times_generated += 1
        self.save()


# ══════════════════════════════════════════════
# Voucher Audit Log
# ══════════════════════════════════════════════

class VoucherAuditLog(models.Model):
    class Action(models.TextChoices):
        CREATED  = 'CREATED',  'Created'
        UPDATED  = 'UPDATED',  'Updated'
        POSTED   = 'POSTED',   'Posted'
        REVERSED = 'REVERSED', 'Reversed'
        DELETED  = 'DELETED',  'Deleted (soft)'

    voucher      = models.ForeignKey(VoucherHeader, on_delete=models.CASCADE,
                                     related_name='audit_logs')
    action       = models.CharField(max_length=10, choices=Action.choices)
    performed_by = models.IntegerField(null=True, blank=True,
                                       help_text='Placeholder → FK to auth.User when ready')
    timestamp    = models.DateTimeField(auto_now_add=True)
    notes        = models.TextField(blank=True)
    snapshot     = models.JSONField(default=dict,
                                    help_text='JSON snapshot of voucher at time of action')

    class Meta:
        db_table = 'fin_voucher_audit_log'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.voucher.voucher_no} | {self.action} | {self.timestamp:%Y-%m-%d %H:%M}'