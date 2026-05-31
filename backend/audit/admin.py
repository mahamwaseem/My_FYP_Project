from django.contrib import admin
from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor_name', 'actor_role', 'action', 'entity_type', 'entity_label')
    list_filter = ('action', 'entity_type', 'actor_role')
    search_fields = ('actor_name', 'entity_label', 'entity_id', 'note')
    readonly_fields = [f.name for f in AuditEvent._meta.fields]

    def has_add_permission(self, request):
        return False  # audit events are written by the system only
