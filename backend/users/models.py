"""
FinTrack — User model for authentication & RBAC.

Self-contained (does NOT replace Django's AUTH_USER_MODEL, so it can be added
safely to a project that has already migrated). Passwords are hashed with
Django's password hashers (PBKDF2 by default) via set_password/check_password.

Three roles, matching the proposal: admin / accountant / viewer.
"""
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone


class Role(models.TextChoices):
    ADMIN = 'admin', 'Administrator'
    ACCOUNTANT = 'accountant', 'Accountant'
    VIEWER = 'viewer', 'User / Viewer'


class Status(models.TextChoices):
    ACTIVE = 'active', 'Active'
    DISABLED = 'disabled', 'Disabled'


class User(models.Model):
    """A FinTrack application user."""
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, db_index=True)
    password = models.CharField(max_length=128)          # hashed, never plain
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.VIEWER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fin_user'
        ordering = ['id']

    def __str__(self):
        return f'{self.name} <{self.email}> ({self.role})'

    # ── password helpers ──────────────────────────────────────────────────────
    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def touch_login(self):
        self.last_login = timezone.now()
        self.save(update_fields=['last_login'])

    # ── role helpers ──────────────────────────────────────────────────────────
    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_accountant(self):
        return self.role == Role.ACCOUNTANT

    @property
    def is_viewer(self):
        return self.role == Role.VIEWER

    @property
    def is_active_user(self):
        return self.status == Status.ACTIVE

    # convenient public dict for API responses
    @property
    def public(self):
        return {
            'id': self.id,
            'user_id': f'USR-{self.id:03d}',
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'status': self.status,
            'last_login': self.last_login.strftime('%Y-%m-%d %H:%M') if self.last_login else None,
        }
