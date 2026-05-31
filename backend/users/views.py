"""
FinTrack — Auth views.

Endpoints under /api/auth/ returning { success, data }:
  POST  register/         self-register (→ Viewer)
  POST  login/            email + password → { access, refresh, user }
  POST  token/refresh/    refresh → { access }
  GET   profile/          current user (auth required)
  POST  logout/           (stateless JWT — client discards tokens)
  GET   users/            list users (admin)
  POST  users/            create user (admin)
  PATCH users/<id>/role/  change role (admin)
  PATCH users/<id>/status/ enable/disable (admin)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as http
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, Status
from .auth import tokens_for, access_from_refresh, JWTUserAuthentication
from .permissions import IsAuthenticatedUser, IsAdmin
from .serializers import (
    UserPublicSerializer, RegisterSerializer, LoginSerializer,
    AdminCreateUserSerializer, RoleUpdateSerializer, StatusUpdateSerializer,
    AdminSetPasswordSerializer, ChangePasswordSerializer,
)

# Central system-wide audit trail.
from audit.services import record as audit_record
from audit.models import AuditAction


def ok(data, code=http.HTTP_200_OK):
    return Response({'success': True, 'data': data}, status=code)

def fail(detail, code=http.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'detail': detail}, status=code)


def _login_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


# ── public: register ─────────────────────────────────────────────────────────
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if not s.is_valid():
            return fail(_first_error(s.errors))
        user = s.save()
        toks = tokens_for(user)
        user.touch_login()
        audit_record(AuditAction.CREATED, 'user',
                     actor={'actor_id': user.id, 'actor_name': user.name, 'actor_role': user.role},
                     entity_id=user.id, entity_label=user.name,
                     note='Self-registered as Viewer.', ip=_login_ip(request))
        return ok({**toks, 'user': UserPublicSerializer(user).data}, http.HTTP_201_CREATED)


# ── public: login ─────────────────────────────────────────────────────────────
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        s = LoginSerializer(data=request.data)
        if not s.is_valid():
            return fail(_first_error(s.errors))
        email = s.validated_data['email'].lower().strip()
        password = s.validated_data['password']

        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            audit_record(AuditAction.LOGIN_FAILED, 'auth',
                         actor={'actor_id': None, 'actor_name': email, 'actor_role': ''},
                         entity_label=email, note='Failed sign-in (bad credentials).',
                         ip=_login_ip(request))
            return fail('Invalid email or password.', http.HTTP_401_UNAUTHORIZED)
        if user.status != Status.ACTIVE:
            audit_record(AuditAction.LOGIN_FAILED, 'auth',
                         actor={'actor_id': user.id, 'actor_name': user.name, 'actor_role': user.role},
                         entity_label=user.email, note='Sign-in blocked (account disabled).',
                         ip=_login_ip(request))
            return fail('This account is disabled. Contact your administrator.', http.HTTP_403_FORBIDDEN)

        toks = tokens_for(user)
        user.touch_login()
        audit_record(AuditAction.LOGIN, 'auth',
                     actor={'actor_id': user.id, 'actor_name': user.name, 'actor_role': user.role},
                     entity_id=user.id, entity_label=user.name, note='Signed in.',
                     ip=_login_ip(request))
        return ok({**toks, 'user': UserPublicSerializer(user).data})


# ── token refresh ─────────────────────────────────────────────────────────────
class TokenRefreshView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return fail('Refresh token required.')
        try:
            access = access_from_refresh(refresh)
        except TokenError:
            return fail('Invalid or expired refresh token.', http.HTTP_401_UNAUTHORIZED)
        return ok({'access': access})


# ── profile (current user) ────────────────────────────────────────────────────
class ProfileView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        return ok(UserPublicSerializer(request.user).data)


# ── logout (stateless) ────────────────────────────────────────────────────────
class LogoutView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        # JWT is stateless; the client discards its tokens. (Blacklist could be
        # added later if token_blacklist app is enabled.)
        audit_record(AuditAction.LOGOUT, 'auth', request=request,
                     entity_id=getattr(request.user, 'id', ''),
                     entity_label=getattr(request.user, 'name', ''), note='Signed out.')
        return ok({'detail': 'Signed out.'})


# ── admin: list + create users ────────────────────────────────────────────────
class UserListCreateView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by('id')
        return ok(UserPublicSerializer(users, many=True).data)

    def post(self, request):
        s = AdminCreateUserSerializer(data=request.data)
        if not s.is_valid():
            return fail(_first_error(s.errors))
        user = s.save()
        audit_record(AuditAction.CREATED, 'user', request=request,
                     entity_id=user.id, entity_label=user.name,
                     note=f"User created as {user.role}.")
        return ok(UserPublicSerializer(user).data, http.HTTP_201_CREATED)


# ── admin: change role ────────────────────────────────────────────────────────
class UserRoleView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if not user:
            return fail('User not found.', http.HTTP_404_NOT_FOUND)
        s = RoleUpdateSerializer(data=request.data)
        if not s.is_valid():
            return fail(_first_error(s.errors))
        # guard: don't let an admin strip their own admin role (lockout safety)
        if user.id == request.user.id and s.validated_data['role'] != 'admin':
            return fail("You can't change your own administrator role.")
        old_role = user.role
        user.role = s.validated_data['role']
        user.save(update_fields=['role'])
        audit_record(
            AuditAction.ROLE_CHANGED, 'user', request=request,
            entity_id=user.id, entity_label=user.name,
            changes=[{'field': 'role', 'old': old_role, 'new': user.role}],
            note=f"Role changed for {user.name}.",
        )
        return ok(UserPublicSerializer(user).data)


# ── admin: enable / disable ───────────────────────────────────────────────────
class UserStatusView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if not user:
            return fail('User not found.', http.HTTP_404_NOT_FOUND)
        s = StatusUpdateSerializer(data=request.data)
        if not s.is_valid():
            return fail(_first_error(s.errors))
        if user.id == request.user.id and s.validated_data['status'] != 'active':
            return fail("You can't disable your own account.")
        old_status = user.status
        user.status = s.validated_data['status']
        user.save(update_fields=['status'])
        audit_record(
            AuditAction.STATUS_CHANGED, 'user', request=request,
            entity_id=user.id, entity_label=user.name,
            changes=[{'field': 'status', 'old': old_status, 'new': user.status}],
            note=f"{user.name} {'enabled' if user.status == 'active' else 'disabled'}.",
        )
        return ok(UserPublicSerializer(user).data)


# ── admin: set/reset a user's password ────────────────────────────────────────
class UserPasswordView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if not user:
            return fail('User not found.', http.HTTP_404_NOT_FOUND)
        s = AdminSetPasswordSerializer(data=request.data)
        if not s.is_valid():
            return fail(_first_error(s.errors))
        user.set_password(s.validated_data['password'])
        user.save(update_fields=['password'])
        audit_record(
            AuditAction.PASSWORD_RESET, 'user', request=request,
            entity_id=user.id, entity_label=user.name,
            note=f"Password reset by administrator for {user.name}.",
        )
        return ok({'detail': f"Password updated for {user.name}."})


# ── self: change my own password ──────────────────────────────────────────────
class ChangePasswordView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        s = ChangePasswordSerializer(data=request.data)
        if not s.is_valid():
            return fail(_first_error(s.errors))
        user = request.user
        if not user.check_password(s.validated_data['current_password']):
            return fail('Your current password is incorrect.', http.HTTP_400_BAD_REQUEST)
        user.set_password(s.validated_data['new_password'])
        user.save(update_fields=['password'])
        audit_record(
            AuditAction.PASSWORD_CHANGED, 'user', request=request,
            entity_id=user.id, entity_label=user.name,
            note='Changed own password.',
        )
        return ok({'detail': 'Your password has been changed.'})


def _first_error(errors):
    """Pull a human message out of DRF serializer errors."""
    if isinstance(errors, dict):
        for v in errors.values():
            if isinstance(v, list) and v:
                return str(v[0])
            if isinstance(v, str):
                return v
    return 'Invalid input.'
