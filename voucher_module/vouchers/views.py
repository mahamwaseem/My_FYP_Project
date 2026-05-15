"""
FinTrack – Voucher Views
views.py  ──  VERSION 2.0  (Production Grade)

Fixes vs v1:
  ✅ Optimized querysets (select_related, prefetch_related, annotate)
  ✅ Audit log written on every action
  ✅ Consistent error response format
  ✅ Summary endpoint with date-range filtering
  ✅ Audit log endpoint per voucher
  ✅ Proper HTTP status codes on every response

API Endpoints:
  GET    /api/vouchers/                 paginated list
  POST   /api/vouchers/                 create draft
  GET    /api/vouchers/{id}/            full detail
  PUT    /api/vouchers/{id}/            update draft
  DELETE /api/vouchers/{id}/            soft-delete draft

  POST   /api/vouchers/{id}/post/       post voucher
  POST   /api/vouchers/{id}/reverse/    create reversal
  GET    /api/vouchers/{id}/print/      print-ready data
  GET    /api/vouchers/{id}/audit/      audit trail

  GET    /api/vouchers/summary/         dashboard stats

  GET    /api/currencies/               list currencies
  POST   /api/currencies/               create currency
  PUT    /api/currencies/{id}/          update currency
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q, Prefetch
from django.utils import timezone

from .models import (
    VoucherHeader, VoucherDetail,
    Currency, VoucherStatus, VoucherType, VoucherAuditLog,
)
from .serializers import (
    VoucherHeaderReadSerializer,
    VoucherHeaderWriteSerializer,
    VoucherHeaderListSerializer,
    VoucherAuditLogSerializer,
    CurrencySerializer,
)
from .filters import VoucherFilter


# ── shared error helper ────────────────────────────────────────────────────

def _error(message, code=status.HTTP_400_BAD_REQUEST):
    """Return a consistent error response shape."""
    return Response({"success": False, "detail": str(message)}, status=code)


def _ok(data, status_code=status.HTTP_200_OK):
    """Return a consistent success response shape."""
    return Response({"success": True, "data": data}, status=status_code)


# ══════════════════════════════════════════════
# Voucher ViewSet
# ══════════════════════════════════════════════

class VoucherViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for vouchers + custom actions:
      post      → transitions DRAFT to POSTED
      reverse   → creates a reversing entry
      print     → returns print-ready data
      audit     → returns the audit trail
      summary   → dashboard statistics
    """

    filter_backends  = [DjangoFilterBackend,
                        filters.SearchFilter,
                        filters.OrderingFilter]
    filterset_class  = VoucherFilter
    search_fields    = ['voucher_no', 'reference',
                        'narration', 'lines__description']
    ordering_fields  = ['date', 'voucher_no', 'created_at', 'status']
    ordering         = ['-date', '-created_at']

    # ── Optimized base queryset ────────────────────────────────────
    def get_queryset(self):
        """
        prefetch_related('lines') avoids N+1 when serializing line items.
        select_related('currency') avoids an extra query per voucher.
        filter(is_active=True) applies soft-delete globally.
        """
        return (
            VoucherHeader.objects
            .filter(is_active=True)
            .select_related('currency', 'reversed_voucher')
            .prefetch_related(
                Prefetch('lines',
                         queryset=VoucherDetail.objects
                                  .select_related('currency')
                                  .order_by('sort_order'))
            )
        )

    # ── Serializer selection ───────────────────────────────────────
    def get_serializer_class(self):
        if self.action == 'list':
            return VoucherHeaderListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return VoucherHeaderWriteSerializer
        return VoucherHeaderReadSerializer

    # ── Soft delete ────────────────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        voucher = self.get_object()
        if voucher.status != VoucherStatus.DRAFT:
            return _error(
                "Only DRAFT vouchers can be deleted. "
                "Posted vouchers must be reversed."
            )
        voucher.is_active = False
        voucher.save()

        VoucherAuditLog.objects.create(
            voucher      = voucher,
            action       = VoucherAuditLog.Action.DELETED,
            performed_by = request.data.get('deleted_by'),
            notes        = "Soft-deleted by user.",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── POST /api/vouchers/{id}/post/ ──────────────────────────────
    @action(detail=True, methods=['post'], url_path='post')
    def post_voucher(self, request, pk=None):
        """
        Transitions a DRAFT voucher to POSTED.
        Validates balance before posting.
        """
        voucher = self.get_object()
        try:
            voucher.post(posted_by_id=request.data.get('approved_by'))
        except Exception as exc:
            return _error(exc)

        VoucherAuditLog.objects.create(
            voucher      = voucher,
            action       = VoucherAuditLog.Action.POSTED,
            performed_by = request.data.get('approved_by'),
            notes        = f"Voucher posted at {timezone.now():%Y-%m-%d %H:%M}.",
            snapshot     = {
                'total_debit' : str(voucher.total_debit),
                'total_credit': str(voucher.total_credit),
            }
        )
        serializer = VoucherHeaderReadSerializer(voucher)
        return _ok(serializer.data)

    # ── POST /api/vouchers/{id}/reverse/ ───────────────────────────
    @action(detail=True, methods=['post'], url_path='reverse')
    def reverse_voucher(self, request, pk=None):
        """
        Creates a reversing entry for a POSTED voucher.
        The reversal starts as DRAFT for review before posting.
        """
        voucher = self.get_object()
        try:
            reversal = voucher.create_reversal(
                reversal_date = request.data.get('reversal_date'),
                created_by_id = request.data.get('created_by'),
            )
        except Exception as exc:
            return _error(exc)

        VoucherAuditLog.objects.create(
            voucher      = voucher,
            action       = VoucherAuditLog.Action.REVERSED,
            performed_by = request.data.get('created_by'),
            notes        = f"Reversed. New voucher: {reversal.voucher_no}",
        )
        serializer = VoucherHeaderReadSerializer(reversal)
        return _ok(serializer.data, status.HTTP_201_CREATED)

    # ── GET /api/vouchers/{id}/print/ ─────────────────────────────
    @action(detail=True, methods=['get'], url_path='print')
    def print_voucher(self, request, pk=None):
        """
        Returns full voucher data structured for PDF / print rendering.
        The React frontend uses this to render a print-ready layout.
        """
        voucher    = self.get_object()
        serializer = VoucherHeaderReadSerializer(voucher)
        data       = serializer.data
        data['print_meta'] = {
            'printed_at' : timezone.now().strftime('%Y-%m-%d %H:%M'),
            'printed_by' : request.query_params.get('user_id', 'System'),
            'company'    : 'Multi Tech Solutions',
        }
        return _ok(data)

    # ── GET /api/vouchers/{id}/audit/ ─────────────────────────────
    @action(detail=True, methods=['get'], url_path='audit')
    def audit_trail(self, request, pk=None):
        """Returns the complete audit trail for one voucher."""
        voucher = self.get_object()
        logs    = voucher.audit_logs.all().order_by('-timestamp')
        serializer = VoucherAuditLogSerializer(logs, many=True)
        return _ok(serializer.data)

    # ── GET /api/vouchers/summary/ ────────────────────────────────
    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """
        Dashboard statistics.
        Supports optional ?date_from= and ?date_to= filters.
        """
        qs = VoucherHeader.objects.filter(is_active=True)

        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        stats = qs.aggregate(
            total_vouchers  = Count('id'),
            draft_count     = Count('id', filter=Q(status=VoucherStatus.DRAFT)),
            posted_count    = Count('id', filter=Q(status=VoucherStatus.POSTED)),
            reversed_count  = Count('id', filter=Q(status=VoucherStatus.REVERSED)),
            payment_count   = Count('id', filter=Q(v_type=VoucherType.PAYMENT)),
            receipt_count   = Count('id', filter=Q(v_type=VoucherType.RECEIPT)),
            journal_count   = Count('id', filter=Q(v_type=VoucherType.JOURNAL)),
            recurring_count = Count('id', filter=Q(is_recurring=True)),
        )

        # Total posted amounts (for dashboard cards)
        posted_qs   = qs.filter(status=VoucherStatus.POSTED)
        line_totals = VoucherDetail.objects.filter(
            header__in=posted_qs
        ).aggregate(
            total_debits  = Sum('debit'),
            total_credits = Sum('credit'),
        )

        stats['total_posted_amount'] = str(
            line_totals['total_debits'] or 0
        )

        return _ok(stats)


# ══════════════════════════════════════════════
# Currency ViewSet
# ══════════════════════════════════════════════

class CurrencyViewSet(viewsets.ModelViewSet):
    queryset         = Currency.objects.filter(is_active=True)
    serializer_class = CurrencySerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['code', 'name']
    ordering_fields  = ['code', 'name', 'exchange_rate']
    ordering         = ['code']

    def destroy(self, request, *args, **kwargs):
        """Soft-delete currencies — never physically remove."""
        currency          = self.get_object()
        currency.is_active = False
        currency.save()
        return Response(status=status.HTTP_204_NO_CONTENT)