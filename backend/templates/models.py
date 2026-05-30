"""
FinTrack — Voucher Templates models.

A template is a reusable, pre-filled double-entry voucher: fixed accounts on
fixed sides (Dr/Cr), with the amount / date / description left editable when the
template is applied. Applying a template builds a real VoucherHeader + lines and
posts it through the existing Vouchers module — so generated entries are
validated (Debit = Credit) and fully auditable.

Mirrors the voucher type + recurring-frequency choices from the vouchers app so
templates speak the same language as the rest of the system.
"""
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class TemplateType(models.TextChoices):
    PAYMENT = 'PV', 'Payment'
    RECEIPT = 'RV', 'Receipt'
    JOURNAL = 'JV', 'Journal'


class TemplateFrequency(models.TextChoices):
    DAILY     = 'DAILY',     'Daily'
    WEEKLY    = 'WEEKLY',    'Weekly'
    MONTHLY   = 'MONTHLY',   'Monthly'
    QUARTERLY = 'QUARTERLY', 'Quarterly'
    YEARLY    = 'YEARLY',    'Yearly'


class VoucherTemplate(models.Model):
    """A reusable voucher blueprint."""
    name           = models.CharField(max_length=120)
    v_type         = models.CharField(max_length=2, choices=TemplateType.choices,
                                      help_text='Receipt / Payment / Journal')
    description    = models.CharField(max_length=255, blank=True)
    tag            = models.CharField(max_length=40, blank=True,
                                      help_text='Grouping label, e.g. Overheads / Payroll')

    # default amount applied to the lines (editable at apply time)
    default_amount = models.DecimalField(max_digits=18, decimal_places=2,
                                         default=Decimal('0.00'),
                                         validators=[MinValueValidator(Decimal('0.00'))])

    # recurring hint — does this template suit recurring use, and how often
    is_recurring   = models.BooleanField(default=False)
    frequency      = models.CharField(max_length=10, choices=TemplateFrequency.choices,
                                      blank=True)

    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fin_voucher_template'
        ordering = ['v_type', 'name']
        indexes  = [
            models.Index(fields=['v_type'],     name='idx_tpl_vtype'),
            models.Index(fields=['is_active'],  name='idx_tpl_active'),
        ]

    def __str__(self):
        return f'{self.get_v_type_display()} template: {self.name}'

    @property
    def total_debit(self):
        return sum((l.default_amount for l in self.lines.all() if l.side == 'debit'), Decimal('0.00'))

    @property
    def total_credit(self):
        return sum((l.default_amount for l in self.lines.all() if l.side == 'credit'), Decimal('0.00'))

    @property
    def is_balanced(self):
        return self.total_debit == self.total_credit


class TemplateSide(models.TextChoices):
    DEBIT  = 'debit',  'Debit'
    CREDIT = 'credit', 'Credit'


class VoucherTemplateLine(models.Model):
    """One pre-filled line of a template: a fixed account on a fixed side."""
    template       = models.ForeignKey(VoucherTemplate, on_delete=models.CASCADE,
                                       related_name='lines')
    account        = models.ForeignKey('accounts.Account', on_delete=models.PROTECT,
                                       related_name='template_lines',
                                       help_text='Locked account from the Chart of Accounts')
    side           = models.CharField(max_length=6, choices=TemplateSide.choices)
    description    = models.CharField(max_length=255, blank=True)

    # Optional fixed amount for this line. When 0/blank, the amount entered at
    # apply time is used (one-debit / one-credit templates). When set, this fixed
    # amount is used instead (lets a template split a total across lines).
    default_amount = models.DecimalField(max_digits=18, decimal_places=2,
                                         default=Decimal('0.00'),
                                         validators=[MinValueValidator(Decimal('0.00'))])
    sort_order     = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'fin_voucher_template_line'
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.template.name} | {self.account} | {self.side}'
