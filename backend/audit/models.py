"""
FinTrack — central audit log.

One table records every meaningful change across the whole system: vouchers,
chart-of-accounts, templates, and user/administration actions. Each event
captures WHO (user id + name + role snapshot), the ACTION, the ENTITY (type +
id + human label), WHEN, and a field-level CHANGES diff (before → after).

Self-contained (no FK to the user table) so it survives even if a user is later
removed, and so the historical name/role are preserved as they were at the time.
"""
from django.db import models
from django.utils import timezone


class AuditAction(models.TextChoices):
    CREATED = 'created', 'Created'
    UPDATED = 'updated', 'Updated'
    DELETED = 'deleted', 'Deleted'
    POSTED = 'posted', 'Posted'
    REVERSED = 'reversed', 'Reversed'
    APPLIED = 'applied', 'Applied'          # template applied → voucher
    GENERATED = 'generated', 'Generated'    # recurring schedule → voucher
    LOGIN = 'login', 'Signed in'
    LOGOUT = 'logout', 'Signed out'
    LOGIN_FAILED = 'login_failed', 'Failed sign-in'
    ROLE_CHANGED = 'role_changed', 'Role changed'
    STATUS_CHANGED = 'status_changed', 'Status changed'
    PASSWORD_RESET = 'password_reset', 'Password reset'
    PASSWORD_CHANGED = 'password_changed', 'Password changed'


class AuditEvent(models.Model):
    """A single recorded action in the system."""
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    # who performed it (snapshot — preserved even if the user changes/leaves)
    actor_id = models.IntegerField(null=True, blank=True, db_index=True)
    actor_name = models.CharField(max_length=150, blank=True, default='System')
    actor_role = models.CharField(max_length=20, blank=True, default='')

    action = models.CharField(max_length=20, choices=AuditAction.choices, db_index=True)

    # what entity it touched
    entity_type = models.CharField(max_length=40, db_index=True)   # e.g. 'voucher', 'account', 'user'
    entity_id = models.CharField(max_length=40, blank=True, default='')
    entity_label = models.CharField(max_length=200, blank=True, default='')  # human name, e.g. 'PV-2026-00006'

    # field-level diff: [{ "field": "...", "old": "...", "new": "..." }, ...]
    changes = models.JSONField(null=True, blank=True)

    note = models.CharField(max_length=300, blank=True, default='')

    # light context
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'fin_audit_event'
        ordering = ['-timestamp', '-id']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['actor_id']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        who = self.actor_name or 'System'
        return f'[{self.timestamp:%Y-%m-%d %H:%M}] {who} {self.action} {self.entity_type} {self.entity_label}'

    @property
    def public(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'actor_id': self.actor_id,
            'actor_name': self.actor_name or 'System',
            'actor_role': self.actor_role or '',
            'action': self.action,
            'action_label': self.get_action_display(),
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'entity_label': self.entity_label,
            'changes': self.changes or [],
            'note': self.note,
            'ip': self.ip,
        }
