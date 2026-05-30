"""
FinTrack — Financial Statements & Reports
views.py

Endpoints (mounted at /api/reports/), response shape { success, data } to match
the rest of the API. All accept query params:
    period       monthly | quarterly | annually
    date_from    YYYY-MM-DD   (overrides period)
    date_to      YYYY-MM-DD   (overrides period)
    comparative  1 | true     (adds prior-year figures)

  GET summary/
  GET balance-sheet/
  GET income-statement/
  GET cash-flow/
  GET trial-balance/
  GET <statement>/export/?format=csv|json   (CSV download; PDF/print done client-side)
"""
import csv
import io

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse

from . import services
from .periods import resolve_period


def _ok(data, **extra):
    body = {"success": True, "data": data}
    body.update(extra)
    return Response(body, status=status.HTTP_200_OK)


def _error(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"success": False, "detail": str(message)}, status=code)


class SummaryView(APIView):
    def get(self, request):
        try:
            p = resolve_period(request.query_params)
            data = services.summary(date_from=p['date_from'], date_to=p['date_to'])
            return _ok(data, period=p['label'])
        except Exception as exc:
            return _error(exc, status.HTTP_500_INTERNAL_SERVER_ERROR)


class BalanceSheetView(APIView):
    def get(self, request):
        try:
            p = resolve_period(request.query_params)
            data = services.balance_sheet(
                date_to=p['date_to'], comparative=p['comparative'], prior_to=p['prior_to'])
            return _ok(data, period=p['label'])
        except Exception as exc:
            return _error(exc, status.HTTP_500_INTERNAL_SERVER_ERROR)


class IncomeStatementView(APIView):
    def get(self, request):
        try:
            p = resolve_period(request.query_params)
            data = services.income_statement(
                date_from=p['date_from'], date_to=p['date_to'],
                comparative=p['comparative'], prior_from=p['prior_from'], prior_to=p['prior_to'])
            return _ok(data, period=p['label'])
        except Exception as exc:
            return _error(exc, status.HTTP_500_INTERNAL_SERVER_ERROR)


class CashFlowView(APIView):
    def get(self, request):
        try:
            p = resolve_period(request.query_params)
            data = services.cash_flow(
                date_from=p['date_from'], date_to=p['date_to'],
                comparative=p['comparative'], prior_from=p['prior_from'], prior_to=p['prior_to'])
            return _ok(data, period=p['label'])
        except Exception as exc:
            return _error(exc, status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrialBalanceView(APIView):
    def get(self, request):
        try:
            p = resolve_period(request.query_params)
            data = services.trial_balance(date_to=p['date_to'])
            return _ok(data, period=p['label'])
        except Exception as exc:
            return _error(exc, status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── CSV export (server-side); PDF/Print handled in the browser ───────────────
STATEMENT_BUILDERS = {
    'balance-sheet':    lambda p: services.balance_sheet(date_to=p['date_to']),
    'income-statement': lambda p: services.income_statement(date_from=p['date_from'], date_to=p['date_to']),
    'cash-flow':        lambda p: services.cash_flow(date_from=p['date_from'], date_to=p['date_to']),
    'trial-balance':    lambda p: services.trial_balance(date_to=p['date_to']),
}


from rest_framework.negotiation import DefaultContentNegotiation


class _IgnoreFormatNegotiation(DefaultContentNegotiation):
    """Ignore the `format` query param so ?format=csv reaches our view
    instead of being treated as a (missing) DRF renderer suffix."""
    def get_request_format(self, request):
        return None
    def select_renderer(self, request, renderers, format_suffix=None):
        return (renderers[0], renderers[0].media_type)


class StatementExportView(APIView):
    content_negotiation_class = _IgnoreFormatNegotiation

    def get(self, request, statement):
        if statement not in STATEMENT_BUILDERS:
            return _error('Unknown statement.', status.HTTP_404_NOT_FOUND)
        fmt = (request.query_params.get('fmt')
               or request.query_params.get('format') or 'csv').lower()
        p = resolve_period(request.query_params)
        data = STATEMENT_BUILDERS[statement](p)

        if fmt == 'json':
            return _ok(data, period=p['label'])

        # default → CSV stream
        buf = io.StringIO()
        w = csv.writer(buf)
        _write_csv(w, statement, data, p['label'])
        resp = HttpResponse(buf.getvalue(), content_type='text/csv')
        resp['Content-Disposition'] = f'attachment; filename="{statement}-{p["label"]}.csv"'
        return resp


def _write_csv(w, statement, d, period_label):
    w.writerow(['FinTrack — ' + statement.replace('-', ' ').title()])
    w.writerow(['Period', period_label])
    w.writerow([])
    if statement == 'balance-sheet':
        _csv_section(w, 'Assets', d['assets']); w.writerow(['Total Assets', d['total_assets']]); w.writerow([])
        _csv_section(w, 'Liabilities', d['liabilities']); w.writerow(['Total Liabilities', d['total_liabilities']]); w.writerow([])
        _csv_section(w, 'Equity', d['equity']); w.writerow(['Total Equity', d['total_equity']]); w.writerow([])
        w.writerow(['Liabilities + Equity', d['total_liabilities_equity']])
        w.writerow(['Balanced', 'Yes' if d['balanced'] else 'No'])
    elif statement == 'income-statement':
        _csv_section(w, 'Income', d['income']); w.writerow(['Total Income', d['total_income']]); w.writerow([])
        _csv_section(w, 'Expenses', d['expenses']); w.writerow(['Total Expenses', d['total_expenses']]); w.writerow([])
        w.writerow(['Net Profit' if d['is_profit'] else 'Net Loss', d['net_profit']])
    elif statement == 'cash-flow':
        _csv_section(w, 'Operating Activities', d['operating']); w.writerow(['Net Operating', d['total_operating']]); w.writerow([])
        _csv_section(w, 'Investing Activities', d['investing']); w.writerow(['Net Investing', d['total_investing']]); w.writerow([])
        _csv_section(w, 'Financing Activities', d['financing']); w.writerow(['Net Financing', d['total_financing']]); w.writerow([])
        w.writerow(['Net Change in Cash', d['net_change']])
        w.writerow(['Opening Cash', d['opening_cash']])
        w.writerow(['Closing Cash', d['closing_cash']])
    elif statement == 'trial-balance':
        w.writerow(['Account', 'Debit', 'Credit'])
        for r in d['rows']:
            w.writerow([r['name'], r['debit'] or '', r['credit'] or ''])
        w.writerow([])
        w.writerow(['Totals', d['total_debit'], d['total_credit']])


def _csv_section(w, title, rows):
    w.writerow([title.upper()])
    for r in rows:
        w.writerow([r['name'], r['amount']])
