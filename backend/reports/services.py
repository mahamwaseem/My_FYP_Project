"""
FinTrack — Financial Statements & Reports
services.py

The reporting engine. It does NOT touch the database directly for transaction
data — it builds entirely on the modules this one depends on:

  • accounts (Chart of Accounts)  → account hierarchy + the five classifications
  • vouchers (posted entries)      → the raw debits/credits
  • general_ledger                 → posted_lines_qs(), classify_account(),
                                     trial_balance()  (reused, never re-implemented)

Every figure traces back to a POSTED VoucherDetail line, exactly like the General
Ledger. Statements are therefore always consistent with the ledger and with each
other. Nothing is stored; everything is computed on request for the given period.

Accounting model
----------------
Account types come from general_ledger.classify_account():
    ASSET, EXPENSE        → debit-normal   (balance = ΣDr − ΣCr)
    LIABILITY, EQUITY, INCOME → credit-normal (balance = ΣCr − ΣDr)

  Balance Sheet  (as-of date_to):
      Assets            = Σ debit-normal balances of ASSET accounts
      Liabilities       = Σ credit-normal balances of LIABILITY accounts
      Equity            = Σ credit-normal balances of EQUITY accounts
                          + Retained earnings for the period (net profit)
      Check: Assets == Liabilities + Equity

  Income Statement  (over date_from..date_to):
      Income   = Σ credit-normal balances of INCOME accounts (period movement)
      Expenses = Σ debit-normal  balances of EXPENSE accounts (period movement)
      Net profit = Income − Expenses

  Cash Flow  (over date_from..date_to):
      Looks at movement on CASH/BANK asset accounts, and classifies each
      contra-line into Operating / Investing / Financing by the type of the
      OTHER account on that voucher — a standard, defensible derivation.

  Trial Balance  →  general_ledger.services.trial_balance()  (reused as-is).
"""

from decimal import Decimal
from django.db.models import Sum, Q

from accounts.models import Account
from vouchers.models import VoucherDetail, VoucherStatus
from general_ledger.models import classify_account
from general_ledger.services import posted_lines_qs, trial_balance as gl_trial_balance

ZERO = Decimal('0.00')

# words that mark an asset account as a cash/bank account (for the cash-flow stmt)
_CASH_HINTS = ('cash', 'bank', 'petty')

# Asset/liability accounts that are *working capital* (operating), not long-term.
# When cash moves against one of these, the flow is Operating — e.g. collecting a
# receivable or paying a supplier — even though the counter-account is an ASSET
# or LIABILITY. Only genuine long-term assets (equipment, property…) are Investing.
_WORKING_CAPITAL_HINTS = (
    'receivable', 'payable', 'debtor', 'creditor', 'prepaid', 'accrued',
    'inventory', 'stock', 'vat', 'tax', 'wages', 'salary', 'salaries',
    'interest', 'supplier', 'customer',
)


# ════════════════════════════════════════════════════════════════════
# helpers
# ════════════════════════════════════════════════════════════════════
def _account_index():
    """All accounts with their derived (type, normal_side), keyed by id."""
    idx = {}
    accounts = (
        Account.objects
        .select_related('account_class__category__group')
        .all()
    )
    for acc in accounts:
        acc_type, normal = classify_account(acc)
        idx[acc.id] = {'account': acc, 'type': acc_type, 'normal': normal,
                       'name': acc.name}
    return idx


def _net_by_account(date_from=None, date_to=None):
    """
    {account_id: (sum_debit, sum_credit)} over the posted lines in the window.
    date_from omitted → from the beginning of time (used for Balance Sheet as-of).
    """
    qs = posted_lines_qs()
    if date_from:
        qs = qs.filter(header__date__gte=date_from)
    if date_to:
        qs = qs.filter(header__date__lte=date_to)
    grouped = qs.values('account_id').annotate(debit=Sum('debit'), credit=Sum('credit'))
    return {g['account_id']: (g['debit'] or ZERO, g['credit'] or ZERO) for g in grouped}


def _balance(normal, debit, credit):
    """Signed balance on the account's normal side."""
    return (debit - credit) if normal == 'DEBIT' else (credit - debit)


def _rows_for_types(types, net, idx, *, as_amount=True):
    """
    Build [{code,name,amount}] for every account whose derived type is in `types`,
    where amount is its normal-side balance. Zero-balance accounts are skipped.
    Returns (rows_sorted, total).
    """
    rows, total = [], ZERO
    for acc_id, meta in idx.items():
        if meta['type'] not in types:
            continue
        dr, cr = net.get(acc_id, (ZERO, ZERO))
        bal = _balance(meta['normal'], dr, cr)
        if bal == ZERO:
            continue
        rows.append({'id': acc_id, 'code': str(acc_id), 'name': meta['name'], 'amount': bal})
        total += bal
    rows.sort(key=lambda r: r['name'].lower())
    return rows, total


# ════════════════════════════════════════════════════════════════════
# INCOME STATEMENT  (period movement)
# ════════════════════════════════════════════════════════════════════
def income_statement(date_from=None, date_to=None, comparative=False,
                     prior_from=None, prior_to=None):
    idx = _account_index()
    net = _net_by_account(date_from, date_to)

    income_rows, total_income = _rows_for_types({'INCOME'}, net, idx)
    expense_rows, total_expenses = _rows_for_types({'EXPENSE'}, net, idx)
    net_profit = total_income - total_expenses

    if comparative and prior_from and prior_to:
        pnet = _net_by_account(prior_from, prior_to)
        _attach_prior(income_rows, {'INCOME'}, pnet, idx)
        _attach_prior(expense_rows, {'EXPENSE'}, pnet, idx)
        p_income = sum((r.get('prior') or ZERO) for r in income_rows)
        p_expense = sum((r.get('prior') or ZERO) for r in expense_rows)
        prior_net = p_income - p_expense
    else:
        prior_net = None

    return {
        'income': income_rows,
        'expenses': expense_rows,
        'total_income': total_income,
        'total_expenses': total_expenses,
        'net_profit': net_profit,
        'is_profit': net_profit >= 0,
        'margin_pct': int(round((net_profit / total_income) * 100)) if total_income else 0,
        'comparative': bool(comparative),
        **({'prior_net_profit': prior_net} if prior_net is not None else {}),
    }


def _attach_prior(rows, types, pnet, idx):
    """Add a `prior` figure to each row from the prior-period net map."""
    for r in rows:
        meta = idx.get(r['id'])
        if not meta:
            continue
        dr, cr = pnet.get(r['id'], (ZERO, ZERO))
        r['prior'] = _balance(meta['normal'], dr, cr)


def _net_profit_through(date_to):
    """Net profit (income − expenses) for all time up to date_to — feeds equity."""
    idx = _account_index()
    net = _net_by_account(None, date_to)
    _, total_income = _rows_for_types({'INCOME'}, net, idx)
    _, total_expenses = _rows_for_types({'EXPENSE'}, net, idx)
    return total_income - total_expenses


# ════════════════════════════════════════════════════════════════════
# BALANCE SHEET  (as-of date_to)
# ════════════════════════════════════════════════════════════════════
def balance_sheet(date_to=None, comparative=False, prior_to=None):
    idx = _account_index()
    net = _net_by_account(None, date_to)  # cumulative, as-of date_to

    asset_rows, total_assets = _rows_for_types({'ASSET'}, net, idx)
    liability_rows, total_liabilities = _rows_for_types({'LIABILITY'}, net, idx)
    equity_rows, equity_base = _rows_for_types({'EQUITY'}, net, idx)

    # Net profit for the period rolls into equity as Retained Earnings —
    # this is the link that makes the sheet balance.
    retained = _net_profit_through(date_to)
    if retained != ZERO:
        equity_rows.append({'id': -1, 'code': '—', 'name': 'Retained Earnings (current)',
                            'amount': retained})
    total_equity = equity_base + retained

    result = {
        'assets': asset_rows,
        'liabilities': liability_rows,
        'equity': equity_rows,
        'total_assets': total_assets,
        'total_liabilities': total_liabilities,
        'total_equity': total_equity,
        'total_liabilities_equity': total_liabilities + total_equity,
        'balanced': abs(total_assets - (total_liabilities + total_equity)) < Decimal('0.01'),
        'comparative': bool(comparative),
    }

    if comparative and prior_to:
        pnet = _net_by_account(None, prior_to)
        _attach_prior(asset_rows, {'ASSET'}, pnet, idx)
        _attach_prior(liability_rows, {'LIABILITY'}, pnet, idx)
        _attach_prior([r for r in equity_rows if r['id'] != -1], {'EQUITY'}, pnet, idx)
        result['prior_total_assets'] = sum((r.get('prior') or ZERO) for r in asset_rows)

    return result


# ════════════════════════════════════════════════════════════════════
# CASH FLOW  (period movement on cash/bank accounts)
# ════════════════════════════════════════════════════════════════════
def _cash_account_ids(idx):
    ids = set()
    for acc_id, meta in idx.items():
        if meta['type'] == 'ASSET' and any(h in meta['name'].lower() for h in _CASH_HINTS):
            ids.add(acc_id)
    return ids


def cash_flow(date_from=None, date_to=None, comparative=False, prior_from=None, prior_to=None):
    """
    For each voucher that touches a cash/bank account, the cash movement on that
    account is attributed to a section based on the type of the *other* accounts
    on the same voucher:
        INCOME / EXPENSE / LIABILITY(non-loan) → Operating
        ASSET (non-cash, e.g. equipment)        → Investing
        EQUITY / loan-like LIABILITY            → Financing
    """
    idx = _account_index()
    cash_ids = _cash_account_ids(idx)

    sections = {'operating': {}, 'investing': {}, 'financing': {}}
    opening_cash = ZERO

    if not cash_ids:
        # No identifiable cash accounts — return an empty but valid structure.
        return _empty_cash_flow(comparative)

    # Opening cash = cumulative cash balance strictly before the window.
    if date_from:
        pre = _net_by_account(None, _day_before(date_from))
        for cid in cash_ids:
            dr, cr = pre.get(cid, (ZERO, ZERO))
            opening_cash += (dr - cr)  # cash is debit-normal

    # Walk every posted line on a cash account within the window, grouped by voucher.
    qs = posted_lines_qs().filter(account_id__in=cash_ids)
    if date_from:
        qs = qs.filter(header__date__gte=date_from)
    if date_to:
        qs = qs.filter(header__date__lte=date_to)

    # Pre-fetch the counter-account types per voucher header.
    header_ids = set(qs.values_list('header_id', flat=True))
    counter_type_by_header = _counter_types(header_ids, cash_ids, idx)

    for line in qs:
        movement = (line.debit - line.credit)  # +inflow / −outflow to cash
        if movement == ZERO:
            continue
        section = _classify_cash_section(counter_type_by_header.get(line.header_id, {}))
        label = _section_line_label(line, movement)
        bucket = sections[section]
        bucket[label] = bucket.get(label, ZERO) + movement

    def to_rows(bucket):
        rows = [{'name': k, 'amount': v} for k, v in bucket.items() if v != ZERO]
        rows.sort(key=lambda r: (-abs(r['amount'])))
        return rows, sum(r['amount'] for r in rows)

    op_rows, t_op = to_rows(sections['operating'])
    inv_rows, t_inv = to_rows(sections['investing'])
    fin_rows, t_fin = to_rows(sections['financing'])
    net_change = t_op + t_inv + t_fin

    return {
        'operating': op_rows,
        'investing': inv_rows,
        'financing': fin_rows,
        'total_operating': t_op,
        'total_investing': t_inv,
        'total_financing': t_fin,
        'net_change': net_change,
        'opening_cash': opening_cash,
        'closing_cash': opening_cash + net_change,
        'comparative': bool(comparative),
    }


def _counter_types(header_ids, cash_ids, idx):
    """
    For each voucher header, a dict of the non-cash accounts it touches:
        { 'types': {ASSET, INCOME, ...}, 'working_capital': bool }
    `working_capital` is True if any counter-account name matches a
    working-capital hint (receivable, payable, inventory, tax, …).
    """
    out = {}
    if not header_ids:
        return out
    lines = (VoucherDetail.objects
             .filter(header_id__in=header_ids)
             .exclude(account_id__in=cash_ids)
             .values('header_id', 'account_id'))
    for l in lines:
        meta = idx.get(l['account_id'])
        if not meta:
            continue
        entry = out.setdefault(l['header_id'], {'types': set(), 'working_capital': False})
        entry['types'].add(meta['type'])
        name = meta['name'].lower()
        if any(h in name for h in _WORKING_CAPITAL_HINTS):
            entry['working_capital'] = True
    return out


def _classify_cash_section(counter):
    """
    counter = { 'types': set(), 'working_capital': bool }  (or empty set fallback).
    Rules (standard, defensible):
      • EQUITY counter (capital, drawings)            → Financing
      • working-capital counter (AR/AP/inventory/tax) → Operating
      • purely long-term ASSET counter (equipment…)   → Investing
      • income / expense / everything else            → Operating
    """
    if not counter or not counter.get('types'):
        return 'operating'
    types = counter['types']
    if 'EQUITY' in types:
        return 'financing'
    if counter.get('working_capital'):
        return 'operating'
    # long-term asset purchase/sale with cash, no working-capital/P&L involvement
    if 'ASSET' in types and not (types & {'INCOME', 'EXPENSE'}):
        return 'investing'
    return 'operating'


def _section_line_label(line, movement):
    base = (line.description or line.header.narration or line.header.voucher_no or 'Cash movement').strip()
    return base[:48]


def _empty_cash_flow(comparative):
    return {
        'operating': [], 'investing': [], 'financing': [],
        'total_operating': ZERO, 'total_investing': ZERO, 'total_financing': ZERO,
        'net_change': ZERO, 'opening_cash': ZERO, 'closing_cash': ZERO,
        'comparative': bool(comparative),
    }


def _day_before(d):
    from datetime import datetime, timedelta, date as _date
    if isinstance(d, str):
        d = datetime.strptime(d, '%Y-%m-%d').date()
    if isinstance(d, _date):
        return d - timedelta(days=1)
    return d


# ════════════════════════════════════════════════════════════════════
# TRIAL BALANCE  (reuse the GL engine verbatim)
# ════════════════════════════════════════════════════════════════════
def trial_balance(date_to=None):
    rows, totals = gl_trial_balance(date_to=date_to)
    out_rows = [{
        'id': r['account_id'],
        'code': str(r['account_id']),
        'name': r['account_name'],
        'type': r['type'],
        'debit': r['debit'],
        'credit': r['credit'],
    } for r in rows]
    return {
        'rows': out_rows,
        'total_debit': totals['debit'],
        'total_credit': totals['credit'],
        'balanced': totals['balanced'],
    }


# ════════════════════════════════════════════════════════════════════
# SUMMARY (KPIs + per-statement status for the cards)
# ════════════════════════════════════════════════════════════════════
def summary(date_from=None, date_to=None):
    bs = balance_sheet(date_to=date_to)
    incm = income_statement(date_from=date_from, date_to=date_to)
    tb = trial_balance(date_to=date_to)
    return {
        'total_assets': bs['total_assets'],
        'net_profit': incm['net_profit'],
        'is_profit': incm['is_profit'],
        'total_debit': tb['total_debit'],
        'total_credit': tb['total_credit'],
        'balanced': tb['balanced'],
        'accounts': len(tb['rows']),
        'statuses': {
            'balance':  'Ready' if bs['balanced'] else 'Draft',
            'income':   'Ready',
            'cashflow': 'Ready',
            'trial':    'Ready' if tb['balanced'] else 'Draft',
        },
    }
