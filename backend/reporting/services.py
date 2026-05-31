"""
FinTrack — Reporting services.

Assembles the five Reporting-module reports from posted ledger data. Reuses the
general_ledger services (trial_balance, account_ledger, posted_lines_qs,
classify_account) and the vouchers audit log — no new persistence, no
re-implementation of accounting logic.

Every builder returns a plain dict shaped exactly for the frontend.
"""
from decimal import Decimal
from django.db.models import Sum, Count

from accounts.models import Account
from general_ledger.models import classify_account
from general_ledger.services import posted_lines_qs, trial_balance, account_ledger
from vouchers.models import VoucherAuditLog

ZERO = Decimal('0.00')


def _str(d):
    """Money as a fixed 2-decimal string (e.g. '265000.00')."""
    if d is None:
        d = ZERO
    try:
        return str(Decimal(d).quantize(Decimal('0.01')))
    except Exception:
        return str(d)


# ── 1. Account Balances ──────────────────────────────────────────────────────
def account_balances(date_to=None):
    """Every account with a posted balance, its closing balance, and Dr/Cr side."""
    rows_tb, totals = trial_balance(date_to=date_to)
    rows = []
    for r in rows_tb:
        on_debit = r['debit'] and r['debit'] > ZERO
        on_credit = r['credit'] and r['credit'] > ZERO
        balance = r['debit'] if on_debit else r['credit']
        side = 'Dr' if on_debit else ('Cr' if on_credit else '—')
        rows.append({
            'code': str(r['account_id']),
            'name': r['account_name'],
            'type': r['type'].title() if r.get('type') else '—',
            'balance': _str(balance),
            'side': side,
        })
    return {
        'rows': rows,
        'total_debit': _str(totals['debit']),
        'total_credit': _str(totals['credit']),
        'balanced': bool(totals['balanced']),
    }


# ── 2. Transaction Summary ───────────────────────────────────────────────────
def transaction_summary(date_from=None, date_to=None):
    """Postings over a period, totalled per account (debit/credit/net/count)."""
    qs = posted_lines_qs()
    if date_from:
        qs = qs.filter(header__date__gte=date_from)
    if date_to:
        qs = qs.filter(header__date__lte=date_to)

    grouped = (
        qs.values('account_id')
          .annotate(debit=Sum('debit'), credit=Sum('credit'), count=Count('id'))
          .order_by('account_id')
    )

    # account lookup (type + name) in one query
    acc_ids = [g['account_id'] for g in grouped]
    accs = {a.id: a for a in Account.objects
            .select_related('account_class__category__group')
            .filter(id__in=acc_ids)}

    rows = []
    total_debit = ZERO
    total_credit = ZERO
    for g in grouped:
        acc = accs.get(g['account_id'])
        acc_type, _ = classify_account(acc) if acc else ('—', 'DEBIT')
        dr = g['debit'] or ZERO
        cr = g['credit'] or ZERO
        total_debit += dr
        total_credit += cr
        rows.append({
            'code': str(g['account_id']),
            'name': acc.name if acc else f'#{g["account_id"]}',
            'type': acc_type.title() if acc_type else '—',
            'debit': _str(dr),
            'credit': _str(cr),
            'net': _str(dr - cr),
            'count': g['count'],
        })

    # how many distinct vouchers contributed
    voucher_count = qs.values('header_id').distinct().count()
    txn_count = qs.count()

    return {
        'rows': rows,
        'total_debit': _str(total_debit),
        'total_credit': _str(total_credit),
        'transaction_count': txn_count,
        'voucher_count': voucher_count,
    }


# ── 3. Audit Trail ───────────────────────────────────────────────────────────
def audit_trail(date_from=None, date_to=None, limit=500):
    """Chronological voucher action log (created/posted/reversed/…)."""
    qs = (VoucherAuditLog.objects
          .select_related('voucher')
          .order_by('-timestamp'))
    if date_from:
        qs = qs.filter(timestamp__date__gte=date_from)
    if date_to:
        qs = qs.filter(timestamp__date__lte=date_to)

    rows = []
    for log in qs[:limit]:
        rows.append({
            'ts': log.timestamp.strftime('%Y-%m-%d %H:%M'),
            'voucher': getattr(log.voucher, 'voucher_no', '—'),
            'action': log.action,
            'by': 'System' if log.performed_by is None else f'User #{log.performed_by}',
            'note': log.notes or '',
        })
    return {'rows': rows, 'count': len(rows)}


# ── 4. Account Statement ─────────────────────────────────────────────────────
def account_statement(account_ref, date_from=None, date_to=None):
    """One account: opening, every movement with running balance, closing."""
    account = _resolve_account(account_ref)
    if account is None:
        return None

    led = account_ledger(account, date_from=date_from, date_to=date_to)
    closing = led['closing_balance']
    acc_type = led['account']['type']
    normal = led['account']['normal_side']
    # closing side: positive balance sits on the account's normal side
    closing_side = ('Dr' if normal == 'DEBIT' else 'Cr') if closing >= ZERO else \
                   ('Cr' if normal == 'DEBIT' else 'Dr')

    rows = []
    for r in led['rows']:
        rows.append({
            'date': r['date'].isoformat() if hasattr(r['date'], 'isoformat') else str(r['date']),
            'voucher': r['voucher_no'],
            'particulars': r['narration'] or r['account_name'],
            'debit': _str(r['debit']),
            'credit': _str(r['credit']),
            'balance': _str(r.get('running_balance')),
        })

    return {
        'account': account.name,
        'type': acc_type.title() if acc_type else '—',
        'opening': _str(led['opening_balance']),
        'rows': rows,
        'total_debit': _str(led['total_debit']),
        'total_credit': _str(led['total_credit']),
        'closing': _str(abs(closing)),
        'closing_side': closing_side,
    }


# ── 5. Custom Summary (comparative current vs prior period) ──────────────────
def custom_summary(date_from=None, date_to=None):
    """
    Comparative management overview: Income, Expenses, Net Profit, Total Assets,
    Total Equity for the selected period vs the prior equivalent period.
    """
    from datetime import date, timedelta

    cur = _period_totals(date_from, date_to)
    # prior equivalent period (same length, immediately before date_from)
    prior_from = prior_to = None
    if date_from and date_to:
        try:
            d_from = date.fromisoformat(str(date_from))
            d_to = date.fromisoformat(str(date_to))
            span = (d_to - d_from).days + 1
            prior_to = d_from - timedelta(days=1)
            prior_from = prior_to - timedelta(days=span - 1)
        except Exception:
            prior_from = prior_to = None
    prior = _period_totals(prior_from, prior_to)

    def grp(label, c, p, emphasis=False):
        row = {'label': label, 'current': _str(c), 'prior': _str(p)}
        if emphasis:
            row['emphasis'] = True
        return row

    groups = [
        grp('Income', cur['income'], prior['income']),
        grp('Expenses', cur['expenses'], prior['expenses']),
        grp('Net Profit', cur['net'], prior['net'], emphasis=True),
        grp('Total Assets', cur['assets'], prior['assets']),
        grp('Total Equity', cur['equity'], prior['equity']),
    ]
    return {
        'groups': groups,
        'current_label': _period_label(date_from, date_to),
        'prior_label': _period_label(prior_from, prior_to),
    }


# ── helpers ──────────────────────────────────────────────────────────────────
def _resolve_account(ref):
    if ref is None:
        return None
    ref = str(ref).strip()
    if ref.isdigit():
        acc = Account.objects.filter(pk=int(ref)).first()
        if acc:
            return acc
    return Account.objects.filter(name__iexact=ref).first()


def _period_totals(date_from, date_to):
    """Income, expenses, net, assets, equity totals over a window (posted only)."""
    qs = posted_lines_qs()
    if date_from:
        qs = qs.filter(header__date__gte=date_from)
    if date_to:
        qs = qs.filter(header__date__lte=date_to)

    income = expenses = assets = liabilities = equity = ZERO
    grouped = qs.values('account_id').annotate(debit=Sum('debit'), credit=Sum('credit'))
    acc_ids = [g['account_id'] for g in grouped]
    accs = {a.id: a for a in Account.objects
            .select_related('account_class__category__group')
            .filter(id__in=acc_ids)}

    for g in grouped:
        acc = accs.get(g['account_id'])
        if not acc:
            continue
        acc_type, _ = classify_account(acc)
        dr = g['debit'] or ZERO
        cr = g['credit'] or ZERO
        t = (acc_type or '').upper()
        if t == 'INCOME':
            income += (cr - dr)
        elif t == 'EXPENSE':
            expenses += (dr - cr)
        elif t == 'ASSET':
            assets += (dr - cr)
        elif t == 'LIABILITY':
            liabilities += (cr - dr)
        elif t == 'EQUITY':
            equity += (cr - dr)

    net = income - expenses
    # equity including the period's retained earnings (net), to mirror the BS
    equity_total = equity + net
    return {
        'income': income, 'expenses': expenses, 'net': net,
        'assets': assets, 'liabilities': liabilities, 'equity': equity_total,
    }


def _period_label(date_from, date_to):
    from datetime import date
    if not date_from or not date_to:
        return 'Selected period'
    try:
        d_from = date.fromisoformat(str(date_from))
        d_to = date.fromisoformat(str(date_to))
        if d_from.year == d_to.year and d_from.month == d_to.month:
            return d_from.strftime('%b %Y')
        return f"{d_from.strftime('%d %b')} – {d_to.strftime('%d %b %Y')}"
    except Exception:
        return f'{date_from} – {date_to}'
"""
FinTrack — Reporting services.

Assembles the five Reporting-module reports from posted ledger data. Reuses the
general_ledger services (trial_balance, account_ledger, posted_lines_qs,
classify_account). The Audit Trail report reads the system-wide central audit
log (audit.AuditEvent) — who did what, to which entity, what changed, and when.

Every builder returns a plain dict shaped exactly for the frontend.
"""
from decimal import Decimal
from django.db.models import Sum, Count

from accounts.models import Account
from general_ledger.models import classify_account
from general_ledger.services import posted_lines_qs, trial_balance, account_ledger

ZERO = Decimal('0.00')


def _str(d):
    """Money as a fixed 2-decimal string (e.g. '265000.00')."""
    if d is None:
        d = ZERO
    try:
        return str(Decimal(d).quantize(Decimal('0.01')))
    except Exception:
        return str(d)


# ── 1. Account Balances ──────────────────────────────────────────────────────
def account_balances(date_to=None):
    """Every account with a posted balance, its closing balance, and Dr/Cr side."""
    rows_tb, totals = trial_balance(date_to=date_to)
    rows = []
    for r in rows_tb:
        on_debit = r['debit'] and r['debit'] > ZERO
        on_credit = r['credit'] and r['credit'] > ZERO
        balance = r['debit'] if on_debit else r['credit']
        side = 'Dr' if on_debit else ('Cr' if on_credit else '—')
        rows.append({
            'code': str(r['account_id']),
            'name': r['account_name'],
            'type': r['type'].title() if r.get('type') else '—',
            'balance': _str(balance),
            'side': side,
        })
    return {
        'rows': rows,
        'total_debit': _str(totals['debit']),
        'total_credit': _str(totals['credit']),
        'balanced': bool(totals['balanced']),
    }


# ── 2. Transaction Summary ───────────────────────────────────────────────────
def transaction_summary(date_from=None, date_to=None):
    """Postings over a period, totalled per account (debit/credit/net/count)."""
    qs = posted_lines_qs()
    if date_from:
        qs = qs.filter(header__date__gte=date_from)
    if date_to:
        qs = qs.filter(header__date__lte=date_to)

    grouped = (
        qs.values('account_id')
          .annotate(debit=Sum('debit'), credit=Sum('credit'), count=Count('id'))
          .order_by('account_id')
    )

    # account lookup (type + name) in one query
    acc_ids = [g['account_id'] for g in grouped]
    accs = {a.id: a for a in Account.objects
            .select_related('account_class__category__group')
            .filter(id__in=acc_ids)}

    rows = []
    total_debit = ZERO
    total_credit = ZERO
    for g in grouped:
        acc = accs.get(g['account_id'])
        acc_type, _ = classify_account(acc) if acc else ('—', 'DEBIT')
        dr = g['debit'] or ZERO
        cr = g['credit'] or ZERO
        total_debit += dr
        total_credit += cr
        rows.append({
            'code': str(g['account_id']),
            'name': acc.name if acc else f'#{g["account_id"]}',
            'type': acc_type.title() if acc_type else '—',
            'debit': _str(dr),
            'credit': _str(cr),
            'net': _str(dr - cr),
            'count': g['count'],
        })

    # how many distinct vouchers contributed
    voucher_count = qs.values('header_id').distinct().count()
    txn_count = qs.count()

    return {
        'rows': rows,
        'total_debit': _str(total_debit),
        'total_credit': _str(total_credit),
        'transaction_count': txn_count,
        'voucher_count': voucher_count,
    }


# ── 3. Audit Trail (system-wide central log) ─────────────────────────────────
def audit_trail(date_from=None, date_to=None, limit=1000,
                actor=None, action=None, entity_type=None):
    """
    System-wide audit trail from the central AuditEvent log: every create /
    update / delete / post / reverse / apply across vouchers, COA, templates,
    and user/administration actions — with who (name + role), what entity,
    field-level changes (before→after), and when.

    Optional filters: actor (id), action, entity_type, date range.
    """
    from audit.models import AuditEvent

    qs = AuditEvent.objects.all().order_by('-timestamp', '-id')
    if date_from:
        qs = qs.filter(timestamp__date__gte=date_from)
    if date_to:
        qs = qs.filter(timestamp__date__lte=date_to)
    if actor:
        qs = qs.filter(actor_id=actor)
    if action:
        qs = qs.filter(action=action)
    if entity_type:
        qs = qs.filter(entity_type=entity_type)

    rows = []
    for e in qs[:limit]:
        # build a compact human summary of the changes
        changes = e.changes or []
        change_text = '; '.join(
            f"{c.get('field')}: {c.get('old')} -> {c.get('new')}" for c in changes
        ) if changes else ''
        rows.append({
            'id': e.id,
            'ts': e.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'actor': e.actor_name or 'System',
            'actor_role': e.actor_role or '',
            'action': e.action,
            'action_label': e.get_action_display(),
            'entity_type': e.entity_type,
            'entity': e.entity_label or (f"#{e.entity_id}" if e.entity_id else '—'),
            # keep legacy keys so the existing report/CSV keep working
            'voucher': e.entity_label if e.entity_type == 'voucher' else (e.entity_label or '—'),
            'by': e.actor_name or 'System',
            'changes': changes,
            'change_text': change_text,
            'note': e.note or '',
            'ip': e.ip or '',
        })

    # summary counts for the report header
    summary = {'total': len(rows), 'by_action': {}}
    for r in rows:
        summary['by_action'][r['action']] = summary['by_action'].get(r['action'], 0) + 1

    return {'rows': rows, 'count': len(rows), 'summary': summary}


# ── 4. Account Statement ─────────────────────────────────────────────────────
def account_statement(account_ref, date_from=None, date_to=None):
    """One account: opening, every movement with running balance, closing."""
    account = _resolve_account(account_ref)
    if account is None:
        return None

    led = account_ledger(account, date_from=date_from, date_to=date_to)
    closing = led['closing_balance']
    acc_type = led['account']['type']
    normal = led['account']['normal_side']
    # closing side: positive balance sits on the account's normal side
    closing_side = ('Dr' if normal == 'DEBIT' else 'Cr') if closing >= ZERO else \
                   ('Cr' if normal == 'DEBIT' else 'Dr')

    rows = []
    for r in led['rows']:
        rows.append({
            'date': r['date'].isoformat() if hasattr(r['date'], 'isoformat') else str(r['date']),
            'voucher': r['voucher_no'],
            'particulars': r['narration'] or r['account_name'],
            'debit': _str(r['debit']),
            'credit': _str(r['credit']),
            'balance': _str(r.get('running_balance')),
        })

    return {
        'account': account.name,
        'type': acc_type.title() if acc_type else '—',
        'opening': _str(led['opening_balance']),
        'rows': rows,
        'total_debit': _str(led['total_debit']),
        'total_credit': _str(led['total_credit']),
        'closing': _str(abs(closing)),
        'closing_side': closing_side,
    }


# ── 5. Custom Summary (comparative current vs prior period) ──────────────────
def custom_summary(date_from=None, date_to=None):
    """
    Comparative management overview: Income, Expenses, Net Profit, Total Assets,
    Total Equity for the selected period vs the prior equivalent period.
    """
    from datetime import date, timedelta

    cur = _period_totals(date_from, date_to)
    # prior equivalent period (same length, immediately before date_from)
    prior_from = prior_to = None
    if date_from and date_to:
        try:
            d_from = date.fromisoformat(str(date_from))
            d_to = date.fromisoformat(str(date_to))
            span = (d_to - d_from).days + 1
            prior_to = d_from - timedelta(days=1)
            prior_from = prior_to - timedelta(days=span - 1)
        except Exception:
            prior_from = prior_to = None
    prior = _period_totals(prior_from, prior_to)

    def grp(label, c, p, emphasis=False):
        row = {'label': label, 'current': _str(c), 'prior': _str(p)}
        if emphasis:
            row['emphasis'] = True
        return row

    groups = [
        grp('Income', cur['income'], prior['income']),
        grp('Expenses', cur['expenses'], prior['expenses']),
        grp('Net Profit', cur['net'], prior['net'], emphasis=True),
        grp('Total Assets', cur['assets'], prior['assets']),
        grp('Total Equity', cur['equity'], prior['equity']),
    ]
    return {
        'groups': groups,
        'current_label': _period_label(date_from, date_to),
        'prior_label': _period_label(prior_from, prior_to),
    }


# ── helpers ──────────────────────────────────────────────────────────────────
def _resolve_account(ref):
    if ref is None:
        return None
    ref = str(ref).strip()
    if ref.isdigit():
        acc = Account.objects.filter(pk=int(ref)).first()
        if acc:
            return acc
    return Account.objects.filter(name__iexact=ref).first()


def _period_totals(date_from, date_to):
    """Income, expenses, net, assets, equity totals over a window (posted only)."""
    qs = posted_lines_qs()
    if date_from:
        qs = qs.filter(header__date__gte=date_from)
    if date_to:
        qs = qs.filter(header__date__lte=date_to)

    income = expenses = assets = liabilities = equity = ZERO
    grouped = qs.values('account_id').annotate(debit=Sum('debit'), credit=Sum('credit'))
    acc_ids = [g['account_id'] for g in grouped]
    accs = {a.id: a for a in Account.objects
            .select_related('account_class__category__group')
            .filter(id__in=acc_ids)}

    for g in grouped:
        acc = accs.get(g['account_id'])
        if not acc:
            continue
        acc_type, _ = classify_account(acc)
        dr = g['debit'] or ZERO
        cr = g['credit'] or ZERO
        t = (acc_type or '').upper()
        if t == 'INCOME':
            income += (cr - dr)
        elif t == 'EXPENSE':
            expenses += (dr - cr)
        elif t == 'ASSET':
            assets += (dr - cr)
        elif t == 'LIABILITY':
            liabilities += (cr - dr)
        elif t == 'EQUITY':
            equity += (cr - dr)

    net = income - expenses
    # equity including the period's retained earnings (net), to mirror the BS
    equity_total = equity + net
    return {
        'income': income, 'expenses': expenses, 'net': net,
        'assets': assets, 'liabilities': liabilities, 'equity': equity_total,
    }


def _period_label(date_from, date_to):
    from datetime import date
    if not date_from or not date_to:
        return 'Selected period'
    try:
        d_from = date.fromisoformat(str(date_from))
        d_to = date.fromisoformat(str(date_to))
        if d_from.year == d_to.year and d_from.month == d_to.month:
            return d_from.strftime('%b %Y')
        return f"{d_from.strftime('%d %b')} – {d_to.strftime('%d %b %Y')}"
    except Exception:
        return f'{date_from} – {date_to}'