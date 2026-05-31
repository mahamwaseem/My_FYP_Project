"""
FinTrack — Voucher Template views.

CRUD over templates, plus the key `apply` action that turns a template into a
real, posted, auditable voucher via the existing Vouchers module.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone
from decimal import Decimal

from .models import VoucherTemplate
from .serializers import VoucherTemplateSerializer, ApplyTemplateSerializer

# reuse the real Vouchers module — never re-implement posting
from vouchers.models import (
    VoucherHeader, VoucherDetail, VoucherStatus, VoucherAuditLog,
    RecurringSchedule,
)

# Role-based access control: everyone reads; only admin + accountant may
# create/edit/delete templates or apply them (apply creates a voucher).
from users.auth import JWTUserAuthentication
from users.permissions import ReadOnlyOrAccounting

# Central system-wide audit trail.
from audit.services import record as audit_record
from audit.models import AuditAction


def _error(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"success": False, "detail": str(message)}, status=code)


def _ok(data, status_code=status.HTTP_200_OK):
    return Response({"success": True, "data": data}, status=status_code)


class VoucherTemplateViewSet(viewsets.ModelViewSet):
    """
      GET/POST           /api/templates/
      GET/PATCH/DELETE   /api/templates/{id}/
      POST               /api/templates/{id}/apply/   → create (+post) a voucher
    """
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [ReadOnlyOrAccounting]
    serializer_class = VoucherTemplateSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['v_type', 'is_recurring', 'is_active']
    search_fields    = ['name', 'description', 'tag', 'lines__account__name']
    ordering_fields  = ['name', 'v_type', 'created_at']
    ordering         = ['v_type', 'name']

    def get_queryset(self):
        return (VoucherTemplate.objects
                .filter(is_active=True)
                .prefetch_related('lines__account'))

    # soft-delete (keep history)
    def destroy(self, request, *args, **kwargs):
        template = self.get_object()
        template.is_active = False
        template.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── POST /api/templates/{id}/apply/ ────────────────────────────
    @action(detail=True, methods=['post'], url_path='apply')
    def apply(self, request, pk=None):
        """
        Build a real voucher from this template:
          • each template line → a VoucherDetail on its locked account/side,
          • the entered `amount` fills lines whose default_amount is 0
            (one-debit/one-credit templates); lines with a fixed default_amount
            keep theirs,
          • optionally create a RecurringSchedule,
          • post the voucher (enforces Debit = Credit) unless post=false.
        Returns the created voucher.
        """
        template = self.get_object()

        serializer = ApplyTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ov = serializer.validated_data

        amount      = ov['amount']
        the_date    = ov['date']
        description = ov.get('description') or template.name
        reference   = ov.get('reference', '')
        do_post     = ov.get('post', True)
        do_recurring= ov.get('recurring', False)
        frequency   = ov.get('frequency') or template.frequency or 'MONTHLY'
        created_by  = ov.get('created_by')

        lines = list(template.lines.all())
        if len(lines) < 2:
            return _error('This template is incomplete (needs at least two lines).')

        try:
            with transaction.atomic():
                voucher = VoucherHeader.objects.create(
                    v_type           = template.v_type,
                    date             = the_date,
                    reference        = reference,
                    narration        = description,
                    status           = VoucherStatus.DRAFT,
                    is_recurring     = do_recurring,
                    recurring_frequency = frequency if do_recurring else '',
                    created_by       = created_by,
                )
                for ln in lines:
                    # fixed line amount wins; otherwise use the entered amount
                    line_amt = ln.default_amount if ln.default_amount and ln.default_amount > 0 else amount
                    VoucherDetail.objects.create(
                        header      = voucher,
                        account     = ln.account,
                        description = ln.description or description,
                        debit       = line_amt if ln.side == 'debit'  else Decimal('0.00'),
                        credit      = line_amt if ln.side == 'credit' else Decimal('0.00'),
                        sort_order  = ln.sort_order,
                    )

                # optional recurring schedule
                if do_recurring:
                    RecurringSchedule.objects.create(
                        template_voucher = voucher,
                        frequency        = frequency,
                        start_date       = the_date,
                        next_due_date    = the_date,
                    )

                # post it (validates balance) unless explicitly kept as draft
                if do_post:
                    voucher.post(posted_by_id=created_by)

                VoucherAuditLog.objects.create(
                    voucher      = voucher,
                    action       = VoucherAuditLog.Action.POSTED if do_post else VoucherAuditLog.Action.CREATED,
                    performed_by = created_by,
                    notes        = f"Created from template “{template.name}” (#{template.id})"
                                   + (" and posted." if do_post else " (kept as draft)."),
                )
        except Exception as exc:
            return _error(exc)

        # return the created voucher via the vouchers read serializer
        from vouchers.serializers import VoucherHeaderReadSerializer
        data = VoucherHeaderReadSerializer(voucher).data
        audit_record(
            AuditAction.APPLIED, 'voucher', request=request,
            entity_id=voucher.id, entity_label=voucher.voucher_no,
            note=f"Created from template “{template.name}”"
                 + (" and posted." if do_post else " (draft)."),
        )
        return _ok({
            'voucher': data,
            'voucher_no': voucher.voucher_no,
            'posted': do_post,
            'recurring': do_recurring,
        }, status.HTTP_201_CREATED)