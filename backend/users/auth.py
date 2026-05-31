"""
FinTrack — JWT auth plumbing for the self-contained User model.

We issue and verify JWTs with djangorestframework-simplejwt's low-level
AccessToken / RefreshToken (which don't require Django's AUTH_USER_MODEL), and
provide a DRF authentication class that resolves the token back to our User.
"""
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import User, Status

USER_CLAIM = 'uid'
ROLE_CLAIM = 'role'


def tokens_for(user):
    """Return a fresh {access, refresh} pair carrying the user id + role."""
    refresh = RefreshToken()
    refresh[USER_CLAIM] = user.id
    refresh[ROLE_CLAIM] = user.role
    access = refresh.access_token
    access[USER_CLAIM] = user.id
    access[ROLE_CLAIM] = user.role
    return {'access': str(access), 'refresh': str(refresh)}


def access_from_refresh(refresh_str):
    """Mint a new access token from a refresh token string."""
    refresh = RefreshToken(refresh_str)
    access = refresh.access_token
    # carry claims through
    if USER_CLAIM in refresh:
        access[USER_CLAIM] = refresh[USER_CLAIM]
    if ROLE_CLAIM in refresh:
        access[ROLE_CLAIM] = refresh[ROLE_CLAIM]
    return str(access)


class JWTUserAuthentication(BaseAuthentication):
    """
    Reads `Authorization: Bearer <access>`, validates it, and attaches the
    resolved FinTrack User as request.user. Disabled accounts are rejected.
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        header = request.META.get('HTTP_AUTHORIZATION', '')
        if not header.startswith(self.keyword + ' '):
            return None  # no credentials → let other auth (or AllowAny) handle

        raw = header[len(self.keyword) + 1:].strip()
        try:
            token = AccessToken(raw)
        except TokenError:
            raise AuthenticationFailed('Invalid or expired token.')

        uid = token.get(USER_CLAIM)
        if uid is None:
            raise AuthenticationFailed('Token missing user claim.')

        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            raise AuthenticationFailed('User no longer exists.')

        if user.status != Status.ACTIVE:
            raise AuthenticationFailed('This account is disabled.')

        # DRF expects (user, auth). We tag the user so permissions can read role.
        user.is_authenticated = True   # duck-typing for DRF/IsAuthenticated
        return (user, token)
