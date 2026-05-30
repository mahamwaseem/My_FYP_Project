# ══════════════════════════════════════════════
# vouchers/filters.py
# ══════════════════════════════════════════════

import django_filters
from .models import VoucherHeader, VoucherType, VoucherStatus


class VoucherFilter(django_filters.FilterSet):
    # Date range
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte',
                                           label='Date From')
    date_to   = django_filters.DateFilter(field_name='date', lookup_expr='lte',
                                           label='Date To')
    # Type and status (allow multiple e.g. ?v_type=PV&v_type=RV)
    v_type    = django_filters.MultipleChoiceFilter(choices=VoucherType.choices)
    status    = django_filters.MultipleChoiceFilter(choices=VoucherStatus.choices)

    # Account filter (for ledger-style queries: all vouchers touching account X)
    account_id = django_filters.NumberFilter(
                     field_name='lines__account_id',
                     label='Account ID')

    # Amount range
    min_amount = django_filters.NumberFilter(
                     field_name='lines__debit', lookup_expr='gte',
                     label='Min Amount')
    max_amount = django_filters.NumberFilter(
                     field_name='lines__debit', lookup_expr='lte',
                     label='Max Amount')

    class Meta:
        model  = VoucherHeader
        fields = [
            'date_from', 'date_to',
            'v_type', 'status',
            'account_id',
            'is_recurring', 'is_reversal',
            'min_amount', 'max_amount',
        ]



