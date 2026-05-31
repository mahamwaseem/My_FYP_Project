"""
FinTrack — Reporting views.

Thin read-only endpoints that return the five reports as { success, data }.
Query params: date_from, date_to, account (for the statement), period (echoed).
Also a generic export endpoint (format=csv|json).
"""
import csv
import io
import json as _json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse, JsonResponse

from . import services

# Authentication & RBAC: the Audit Trail report shows who performed each action,
# so it is treated as administrative/security data — Admin only. All other
# reports stay readable by everyone (Option B), matching professional systems.
from users.auth import JWTUserAuthentication
from users.permissions import IsAdmin
from users.models import Role


def _is_admin_request(request):
    """True if the Bearer token resolves to an admin user. Used by the plain
    (non-DRF) export view, which can't use DRF permission classes."""
    try:
        auth = JWTUserAuthentication()
        result = auth.authenticate(request)
        if not result:
            return False
        user, _token = result
        return getattr(user, 'role', None) == Role.ADMIN
    except Exception:
        return False


def _ok(data):
    return Response({'success': True, 'data': data})


def _params(request):
    return {
        'date_from': request.query_params.get('date_from') or None,
        'date_to': request.query_params.get('date_to') or None,
        'account': request.query_params.get('account') or None,
    }


# ── report endpoints ─────────────────────────────────────────────────────────
class AccountBalancesView(APIView):
    def get(self, request):
        p = _params(request)
        return _ok(services.account_balances(date_to=p['date_to']))


class TransactionSummaryView(APIView):
    def get(self, request):
        p = _params(request)
        return _ok(services.transaction_summary(date_from=p['date_from'], date_to=p['date_to']))


class AuditTrailView(APIView):
    # Admin only — the audit trail is administrative/security data (who did what).
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [IsAdmin]

    def get(self, request):
        p = _params(request)
        return _ok(services.audit_trail(date_from=p['date_from'], date_to=p['date_to']))


class AccountStatementView(APIView):
    def get(self, request):
        p = _params(request)
        data = services.account_statement(p['account'], date_from=p['date_from'], date_to=p['date_to'])
        if data is None:
            return Response({'success': False, 'detail': 'Account not found.'},
                            status=status.HTTP_404_NOT_FOUND)
        return _ok(data)


class CustomSummaryView(APIView):
    def get(self, request):
        p = _params(request)
        return _ok(services.custom_summary(date_from=p['date_from'], date_to=p['date_to']))


# ── export (csv | json) ──────────────────────────────────────────────────────
REPORT_FN = {
    'balances': lambda p: services.account_balances(date_to=p['date_to']),
    'txns':     lambda p: services.transaction_summary(date_from=p['date_from'], date_to=p['date_to']),
    'audit':    lambda p: services.audit_trail(date_from=p['date_from'], date_to=p['date_to']),
    'account':  lambda p: services.account_statement(p['account'], date_from=p['date_from'], date_to=p['date_to']),
    'summary':  lambda p: services.custom_summary(date_from=p['date_from'], date_to=p['date_to']),
}

# CSV column layout per report
CSV_COLS = {
    'balances': (['Code', 'Account', 'Type', 'Balance', 'Dr/Cr'],
                 lambda d: [[r['code'], r['name'], r['type'], r['balance'], r['side']] for r in d['rows']]),
    'txns':     (['Code', 'Account', 'Type', 'Debit', 'Credit', 'Net', 'Entries'],
                 lambda d: [[r['code'], r['name'], r['type'], r['debit'], r['credit'], r['net'], r['count']] for r in d['rows']]),
    'audit':    (['Timestamp', 'Voucher', 'Action', 'By', 'Note'],
                 lambda d: [[r['ts'], r['voucher'], r['action'], r['by'], r['note']] for r in d['rows']]),
    'account':  (['Date', 'Voucher', 'Particulars', 'Debit', 'Credit', 'Balance'],
                 lambda d: [[r['date'], r['voucher'], r['particulars'], r['debit'], r['credit'], r['balance']] for r in d['rows']]),
    'summary':  (['Metric', 'Current', 'Prior'],
                 lambda d: [[g['label'], g['current'], g['prior']] for g in d['groups']]),
}


def _export_params(request):
    g = request.GET
    return {
        'date_from': g.get('date_from') or None,
        'date_to': g.get('date_to') or None,
        'account': g.get('account') or None,
    }


def report_export(request, report):
    """
    Generic export. Plain Django view (not DRF) so the ?format=csv query param
    isn't intercepted by DRF content negotiation.
    """
    if report not in REPORT_FN:
        return JsonResponse({'success': False, 'detail': f'Unknown report: {report}'}, status=404)
    # Audit trail is admin-only, including its export.
    if report == 'audit' and not _is_admin_request(request):
        return JsonResponse(
            {'success': False, 'detail': 'The audit trail is available to administrators only.'},
            status=403,
        )
    fmt = (request.GET.get('format') or 'csv').lower()
    p = _export_params(request)
    data = REPORT_FN[report](p)
    if data is None:
        return JsonResponse({'success': False, 'detail': 'Account not found.'}, status=404)

    if fmt == 'json':
        return JsonResponse({'success': True, 'data': data})

    header, row_fn = CSV_COLS[report]
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(header)
    for row in row_fn(data):
        writer.writerow(row)
    resp = HttpResponse(buf.getvalue(), content_type='text/csv')
    resp['Content-Disposition'] = f'attachment; filename="{report}_report.csv"'
    return resp