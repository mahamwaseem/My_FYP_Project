"""
Seed the 10 built-in FinTrack voucher templates into the database.

Idempotent: matches existing templates by name (re-running updates them in place
rather than creating duplicates). Accounts are looked up by name from the Chart
of Accounts — all required accounts must already exist.

Usage:
    python manage.py seed_templates
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Account
from templates.models import VoucherTemplate, VoucherTemplateLine


# (name, type, description, default_amount, recurring, frequency, tag, debit_acct, credit_acct)
TEMPLATES = [
    # ── Receipts ──
    ('Cash Sale', 'RV', 'Record a cash sale — cash in, revenue recognised.',
     10000, False, '', 'Sales', 'Cash in Hand', 'Sales Revenue'),
    ('Customer Payment Received', 'RV', 'Customer settles an outstanding invoice into the bank.',
     25000, False, '', 'Receivables', 'Bank Account', 'Accounts Receivable'),
    ('Capital Introduced', 'RV', 'Owner injects capital into the business bank account.',
     100000, False, '', 'Equity', 'Bank Account', 'Share Capital'),

    # ── Payments ──
    ('Monthly Rent', 'PV', 'Pay office rent from the bank. Ideal as a recurring entry.',
     35000, True, 'MONTHLY', 'Overheads', 'Rent Expense', 'Bank Account'),
    ('Utility Bill', 'PV', 'Pay electricity / water / internet. Recurring monthly.',
     8000, True, 'MONTHLY', 'Overheads', 'Utilities Expense', 'Bank Account'),
    ('Salary Disbursement', 'PV', 'Pay monthly staff salaries from the bank.',
     120000, True, 'MONTHLY', 'Payroll', 'Salaries Expense', 'Bank Account'),
    ('Supplier Payment', 'PV', 'Settle an outstanding supplier payable from the bank.',
     40000, False, '', 'Payables', 'Accounts Payable', 'Bank Account'),

    # ── Journals ──
    ('Monthly Depreciation', 'JV', 'Charge depreciation on fixed assets. Recurring month-end entry.',
     5000, True, 'MONTHLY', 'Adjustments', 'Depreciation Expense', 'Accumulated Depreciation'),
    ('Accrued Expense', 'JV', 'Recognise an expense incurred but not yet paid.',
     6000, False, '', 'Accruals', 'Utilities Expense', 'Accrued Liabilities'),
    ('Prepaid Expense Adjustment', 'JV', 'Move a prepaid amount into the period it belongs to.',
     4000, False, '', 'Adjustments', 'Rent Expense', 'Prepaid Expenses'),
]


class Command(BaseCommand):
    help = 'Seed the 10 built-in voucher templates (idempotent).'

    def handle(self, *args, **options):
        # resolve accounts up front, report any missing
        names = set()
        for t in TEMPLATES:
            names.add(t[7]); names.add(t[8])
        accounts = {a.name: a for a in Account.objects.filter(name__in=names)}
        missing = sorted(names - set(accounts.keys()))
        if missing:
            self.stderr.write(self.style.ERROR(
                'Missing accounts (create these in the Chart of Accounts first):'))
            for m in missing:
                self.stderr.write(f'  - {m}')
            self.stderr.write(self.style.ERROR('Aborted — no templates were seeded.'))
            return

        created, updated = 0, 0
        with transaction.atomic():
            for (name, vtype, desc, amount, recurring, freq, tag, dr, cr) in TEMPLATES:
                tpl, was_created = VoucherTemplate.objects.update_or_create(
                    name=name,
                    defaults=dict(
                        v_type=vtype, description=desc, tag=tag,
                        default_amount=Decimal(str(amount)),
                        is_recurring=recurring, frequency=freq, is_active=True,
                    ),
                )
                # rebuild lines (so re-running stays correct)
                tpl.lines.all().delete()
                VoucherTemplateLine.objects.create(
                    template=tpl, account=accounts[dr], side='debit',
                    description=desc, sort_order=0)
                VoucherTemplateLine.objects.create(
                    template=tpl, account=accounts[cr], side='credit',
                    description=desc, sort_order=1)
                if was_created:
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f'  + created  {name}'))
                else:
                    updated += 1
                    self.stdout.write(f'  ~ updated  {name}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {created} created, {updated} updated. '
            f'Total templates now: {VoucherTemplate.objects.filter(is_active=True).count()}'))
