"""
FinTrack — Reports
periods.py — resolve query params into concrete (date_from, date_to) windows,
and the matching prior-year window when comparatives are requested.
"""
from datetime import date, datetime, timedelta


def _parse(d):
    if not d:
        return None
    if isinstance(d, date):
        return d
    try:
        return datetime.strptime(d, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


def resolve_period(params):
    """
    Returns dict: { date_from, date_to, prior_from, prior_to, comparative, label }.
    Priority: explicit date_from/date_to win; else derive from `period` + today.
    `period` ∈ {monthly, quarterly, annually}.
    """
    comparative = str(params.get('comparative', '')).lower() in ('1', 'true', 'yes')
    date_from = _parse(params.get('date_from'))
    date_to = _parse(params.get('date_to'))
    period = (params.get('period') or '').lower()

    today = date.today()
    if not date_from or not date_to:
        if period == 'monthly':
            date_from = today.replace(day=1)
            date_to = _month_end(date_from)
        elif period == 'quarterly':
            q_start_month = ((today.month - 1) // 3) * 3 + 1
            date_from = today.replace(month=q_start_month, day=1)
            date_to = _month_end(date_from.replace(month=q_start_month + 2)) \
                if q_start_month + 2 <= 12 else date(today.year, 12, 31)
        elif period == 'annually':
            date_from = date(today.year, 1, 1)
            date_to = date(today.year, 12, 31)
        # else: leave whatever was given (possibly None → all-time)

    prior_from = prior_to = None
    if comparative and date_from and date_to:
        prior_from = _shift_year(date_from, -1)
        prior_to = _shift_year(date_to, -1)

    return {
        'date_from': date_from,
        'date_to': date_to,
        'prior_from': prior_from,
        'prior_to': prior_to,
        'comparative': comparative,
        'label': params.get('period') or (f'{date_from} – {date_to}' if date_from else 'All time'),
    }


def _month_end(d):
    if d.month == 12:
        return date(d.year, 12, 31)
    return date(d.year, d.month + 1, 1) - timedelta(days=1)


def _shift_year(d, delta):
    try:
        return d.replace(year=d.year + delta)
    except ValueError:           # Feb 29 → Feb 28
        return d.replace(year=d.year + delta, day=28)
