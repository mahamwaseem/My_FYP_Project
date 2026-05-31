"""
FinTrack — audit recording service.

`record(...)` is the single entry point every view uses to log an action.
`diff_fields(old, new, fields)` builds the before→after change list.

Designed to NEVER break the caller: if logging fails for any reason, it swallows
the error (an audit failure must not roll back a real business operation).
"""
from decimal import Decimal
from .models import AuditEvent, AuditAction


def _actor_from_request(request):
    """Pull the authenticated FinTrack user off the request, if present."""
    u = getattr(request, 'user', None) if request is not None else None
    if u is not None and getattr(u, 'id', None) and getattr(u, 'is_authenticated', False):
        return {
            'actor_id': u.id,
            'actor_name': getattr(u, 'name', None) or getattr(u, 'email', '') or 'User',
            'actor_role': getattr(u, 'role', '') or '',
        }
    return {'actor_id': None, 'actor_name': 'System', 'actor_role': ''}


def _client_ip(request):
    if request is None:
        return None
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _stringify(v):
    """Normalise a value for storage/comparison in the diff."""
    if v is None:
        return None
    if isinstance(v, Decimal):
        # keep money tidy
        return format(v, 'f')
    if isinstance(v, bool):
        return 'true' if v else 'false'
    return str(v)


def diff_fields(old, new, fields):
    """
    Compare two dict-like snapshots over the given field names and return a list
    of { field, old, new } for the ones that actually changed.
    `old`/`new` may be dicts or objects (we getattr/get either way).
    """
    def grab(src, key):
        if src is None:
            return None
        if isinstance(src, dict):
            return src.get(key)
        return getattr(src, key, None)

    changes = []
    for f in fields:
        o = _stringify(grab(old, f))
        n = _stringify(grab(new, f))
        if o != n:
            changes.append({'field': f, 'old': o, 'new': n})
    return changes


def record(action, entity_type, *, request=None, actor=None,
           entity_id='', entity_label='', changes=None, note='', ip=None):
    """
    Write one audit event. Returns the AuditEvent (or None on failure).

    - action: an AuditAction value (or matching string)
    - entity_type: 'voucher' | 'account' | 'group' | 'category' | 'class'
                   | 'template' | 'currency' | 'recurring' | 'user' | 'auth'
    - request: pass the DRF request to auto-capture actor + ip
    - actor: optionally override with a dict {actor_id, actor_name, actor_role}
    """
    try:
        who = actor or _actor_from_request(request)
        return AuditEvent.objects.create(
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id or ''),
            entity_label=(entity_label or '')[:200],
            changes=changes or None,
            note=(note or '')[:300],
            ip=ip if ip is not None else _client_ip(request),
            **who,
        )
    except Exception:
        # Auditing must never break the real operation.
        return None
