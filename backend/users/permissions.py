"""
FinTrack — DRF permission classes (server-side RBAC enforcement).

These are the REAL security: even if the frontend hides a button, the backend
rejects unauthorized actions with 403. Mirrors the permission matrix:
  - view (read): all authenticated roles
  - accounting writes: admin + accountant
  - administration: admin only
"""
from rest_framework.permissions import BasePermission
from .models import Role


def _role(request):
    u = getattr(request, 'user', None)
    return getattr(u, 'role', None) if u is not None else None


class IsAuthenticatedUser(BasePermission):
    message = 'Authentication required.'
    def has_permission(self, request, view):
        u = getattr(request, 'user', None)
        return bool(u is not None and getattr(u, 'id', None) and getattr(u, 'is_authenticated', False))


class IsAdmin(BasePermission):
    message = 'Administrator access required.'
    def has_permission(self, request, view):
        return _role(request) == Role.ADMIN


class IsAccountant(BasePermission):
    message = 'Accountant access required.'
    def has_permission(self, request, view):
        return _role(request) == Role.ACCOUNTANT


class IsViewer(BasePermission):
    message = 'Viewer access required.'
    def has_permission(self, request, view):
        return _role(request) == Role.VIEWER


class IsAdminOrAccountant(BasePermission):
    """Accounting operations: create/edit/post vouchers, manage COA, templates."""
    message = 'You need Accountant or Administrator access to perform this action.'
    def has_permission(self, request, view):
        return _role(request) in (Role.ADMIN, Role.ACCOUNTANT)


class ReadOnlyOrAccounting(BasePermission):
    """
    Reads (GET/HEAD/OPTIONS) are open to everyone — so module list/detail pages
    load without needing a token. Writes (POST/PUT/PATCH/DELETE) require an
    authenticated admin or accountant; viewers and anonymous users get 403.

    (The frontend still gates which pages a user can open via login + role, so
    data is protected at the UI layer; this keeps every *mutation* locked down
    server-side — the operation that actually matters.)
    """
    SAFE = ('GET', 'HEAD', 'OPTIONS')
    message = 'You have read-only access; editing requires Accountant or Administrator.'

    def has_permission(self, request, view):
        # reads: always allowed
        if request.method in self.SAFE:
            return True
        # writes: must be an authenticated admin or accountant
        u = getattr(request, 'user', None)
        if not (u is not None and getattr(u, 'id', None) and getattr(u, 'is_authenticated', False)):
            return False
        return _role(request) in (Role.ADMIN, Role.ACCOUNTANT)