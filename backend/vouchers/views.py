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
from decimal import Decimal, ROUND_HALF_UP

from .models import (
    VoucherHeader, VoucherDetail,
    Currency, VoucherStatus, VoucherType, VoucherAuditLog,
    RecurringSchedule,
)
from .serializers import (
    VoucherHeaderReadSerializer,
    VoucherHeaderWriteSerializer,
    VoucherHeaderListSerializer,
    VoucherAuditLogSerializer,
    CurrencySerializer,
    RecurringScheduleSerializer,
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

    # ── helper: resolve a currency by code or id ───────────────────
    def _resolve(self, key):
        if key is None:
            return None
        key = str(key).strip()
        qs = Currency.objects.filter(is_active=True)
        cur = qs.filter(code__iexact=key).first()
        if cur is None and key.isdigit():
            cur = qs.filter(pk=int(key)).first()
        return cur

    # ── GET /api/vouchers/currencies/convert/ ──────────────────────
    @action(detail=False, methods=['get'], url_path='convert')
    def convert(self, request):
        """
        Automatic currency conversion.
        Query params: amount, from (code or id), to (code or id).

        exchange_rate is stored as base-units per 1 unit of the currency, so:
            base_amount   = amount * from.exchange_rate
            target_amount = base_amount / to.exchange_rate
        """
        raw_amount = request.query_params.get('amount', '1')
        from_key   = request.query_params.get('from')
        to_key     = request.query_params.get('to')

        try:
            amount = Decimal(str(raw_amount))
        except Exception:
            return _error("`amount` must be a number.")
        if amount < 0:
            return _error("`amount` cannot be negative.")

        src = self._resolve(from_key)
        dst = self._resolve(to_key)
        if src is None:
            return _error(f"Unknown source currency: {from_key!r}", status.HTTP_404_NOT_FOUND)
        if dst is None:
            return _error(f"Unknown target currency: {to_key!r}", status.HTTP_404_NOT_FOUND)

        base_amount   = amount * src.exchange_rate
        target_amount = (base_amount / dst.exchange_rate) if dst.exchange_rate else Decimal('0')
        pair_rate     = (src.exchange_rate / dst.exchange_rate) if dst.exchange_rate else Decimal('0')

        q2 = lambda v: str(Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        q6 = lambda v: str(Decimal(v).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP))

        return _ok({
            'amount':       q2(amount),
            'from':         src.code,
            'to':           dst.code,
            'converted':    q2(target_amount),
            'base_amount':  q2(base_amount),
            'pair_rate':    q6(pair_rate),       # 1 `from` = pair_rate `to`
            'from_rate':    q6(src.exchange_rate),
            'to_rate':      q6(dst.exchange_rate),
            'to_symbol':    dst.symbol,
            'from_symbol':  src.symbol,
        })

    # ── GET /api/vouchers/currencies/rates/ ────────────────────────
    @action(detail=False, methods=['get'], url_path='rates')
    def rates(self, request):
        """
        All active currencies with their stored rates, plus which is base.
        Optional ?base=CODE recomputes each rate relative to that currency.
        """
        currencies = list(Currency.objects.filter(is_active=True).order_by('code'))
        base_param = request.query_params.get('base')
        base_cur   = self._resolve(base_param) if base_param else next((c for c in currencies if c.is_base), None)

        q6 = lambda v: str(Decimal(v).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP))
        base_rate = base_cur.exchange_rate if base_cur else Decimal('1')

        rows = []
        for c in currencies:
            # rate to convert 1 base unit into this currency = base_rate / c.rate
            rel = (base_rate / c.exchange_rate) if c.exchange_rate else Decimal('0')
            rows.append({
                'id': c.id, 'code': c.code, 'name': c.name, 'symbol': c.symbol,
                'exchange_rate': q6(c.exchange_rate),
                'is_base': c.is_base,
                'rate_from_base': q6(rel),
            })
        return _ok({
            'base': base_cur.code if base_cur else None,
            'currencies': rows,
        })

# ══════════════════════════════════════════════
# Recurring Schedule ViewSet
# ══════════════════════════════════════════════

class RecurringScheduleViewSet(viewsets.ModelViewSet):
    """
    Manage recurring schedules (salaries, rent, utilities…).

      GET    /api/vouchers/recurring/                list schedules
      POST   /api/vouchers/recurring/                create a schedule
      GET    /api/vouchers/recurring/{id}/           detail
      PUT    /api/vouchers/recurring/{id}/           update
      DELETE /api/vouchers/recurring/{id}/           soft-stop (is_active=False)

      GET    /api/vouchers/recurring/due/            schedules due on/before today
      POST   /api/vouchers/recurring/{id}/generate/  create+post the next voucher
      POST   /api/vouchers/recurring/{id}/toggle/    pause / resume
    """
    queryset         = RecurringSchedule.objects.select_related('template_voucher').prefetch_related('template_voucher__lines')
    serializer_class = RecurringScheduleSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['frequency', 'is_active']
    ordering_fields  = ['next_due_date', 'start_date', 'times_generated']
    ordering         = ['next_due_date']

    # soft-stop instead of hard delete
    def destroy(self, request, *args, **kwargs):
        schedule = self.get_object()
        schedule.is_active = False
        schedule.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── GET /recurring/due/ ────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='due')
    def due(self, request):
        """Active schedules whose next_due_date is today or earlier."""
        today = timezone.now().date()
        qs = (self.get_queryset()
              .filter(is_active=True, next_due_date__lte=today))
        data = self.get_serializer(qs, many=True).data
        return _ok({'as_of': str(today), 'count': len(data), 'schedules': data})

    # ── POST /recurring/{id}/toggle/ ───────────────────────────────
    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle(self, request, pk=None):
        """Pause or resume a schedule."""
        schedule = self.get_object()
        schedule.is_active = not schedule.is_active
        schedule.save()
        return _ok(self.get_serializer(schedule).data)

    # ── POST /recurring/{id}/generate/ ─────────────────────────────
    @action(detail=True, methods=['post'], url_path='generate')
    def generate(self, request, pk=None):
        """
        Generate the next voucher from this schedule's template:
          1. clone the template voucher (header + lines) as a new DRAFT,
             dated on the schedule's next_due_date,
          2. post it (enforces Debit = Credit),
          3. advance the schedule's next_due_date.
        Returns the newly created (posted) voucher.
        """
        schedule = self.get_object()

        if not schedule.is_active:
            return _error("This schedule is paused. Resume it before generating.")

        template = schedule.template_voucher
        run_date = schedule.next_due_date or timezone.now().date()

        from django.db import transaction
        try:
            with transaction.atomic():
                new_voucher = VoucherHeader.objects.create(
                    v_type           = template.v_type,
                    date             = run_date,
                    reference        = template.reference,
                    narration        = f"{template.narration} (recurring {schedule.get_frequency_display().lower()})".strip(),
                    status           = VoucherStatus.DRAFT,
                    currency         = template.currency,
                    exchange_rate    = template.exchange_rate,
                    recurring_parent = template,
                    created_by       = request.data.get('created_by'),
                )
                for line in template.lines.all():
                    VoucherDetail.objects.create(
                        header      = new_voucher,
                        account     = line.account,
                        description = line.description,
                        debit       = line.debit,
                        credit      = line.credit,
                        currency    = line.currency,
                        amount_fc   = line.amount_fc,
                        cost_center = line.cost_center,
                        sort_order  = line.sort_order,
                    )

                # post it (validates balance)
                new_voucher.post(posted_by_id=request.data.get('created_by'))

                # audit + advance the schedule
                VoucherAuditLog.objects.create(
                    voucher      = new_voucher,
                    action       = VoucherAuditLog.Action.POSTED,
                    performed_by = request.data.get('created_by'),
                    notes        = f"Auto-generated from recurring schedule #{schedule.id} "
                                   f"({template.voucher_no}).",
                )
                schedule.advance_due_date()
        except Exception as exc:
            return _error(exc)

        serializer = VoucherHeaderReadSerializer(new_voucher)
        return _ok({
            'voucher': serializer.data,
            'schedule': self.get_serializer(schedule).data,
        }, status.HTTP_201_CREATED)