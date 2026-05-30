from django.contrib import admin
from .models import VoucherTemplate, VoucherTemplateLine


class TemplateLineInline(admin.TabularInline):
    model = VoucherTemplateLine
    extra = 0


@admin.register(VoucherTemplate)
class VoucherTemplateAdmin(admin.ModelAdmin):
    list_display  = ('name', 'v_type', 'tag', 'default_amount', 'is_recurring', 'is_active')
    list_filter   = ('v_type', 'is_recurring', 'is_active')
    search_fields = ('name', 'description', 'tag')
    inlines       = [TemplateLineInline]
