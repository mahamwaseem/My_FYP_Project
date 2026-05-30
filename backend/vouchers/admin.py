from django.contrib import admin
from django.utils.html import format_html
from .models import (
    VoucherHeader, VoucherDetail, Currency,
    RecurringSchedule, VoucherAuditLog,
)


class VoucherDetailInline(admin.TabularInline):
    model  = VoucherDetail
    extra  = 2
    fields = ['account', 'description', 'debit', 'credit', 'cost_center']
    show_change_link = False

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.status != 'DRAFT':
            return [f.name for f in self.model._meta.fields]
        return []


class AuditLogInline(admin.TabularInline):
    model           = VoucherAuditLog
    extra           = 0
    fields          = ['action', 'performed_by', 'timestamp', 'notes']
    readonly_fields = ['action', 'performed_by', 'timestamp', 'notes']
    can_delete      = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(VoucherHeader)
class VoucherHeaderAdmin(admin.ModelAdmin):
    list_display    = ['voucher_no', 'v_type', 'date', 'status',
                       'colored_status', 'total_debit', 'balanced_icon', 'created_at']
    list_filter     = ['v_type', 'status', 'is_recurring', 'date']
    search_fields   = ['voucher_no', 'reference', 'narration']
    readonly_fields = ['voucher_no', 'created_at', 'updated_at', 'posted_at']
    date_hierarchy  = 'date'
    inlines         = [VoucherDetailInline, AuditLogInline]
    list_per_page   = 25

    fieldsets = (
        ('Voucher Info', {
            'fields': ('voucher_no', 'v_type', 'date', 'reference', 'narration', 'status')
        }),
        ('Currency', {
            'fields': ('currency', 'exchange_rate'),
            'classes': ('collapse',),
        }),
        ('Recurring', {
            'fields': ('is_recurring', 'recurring_frequency',
                       'recurring_end_date', 'next_due_date'),
            'classes': ('collapse',),
        }),
        ('Audit', {
            'fields': ('created_by', 'approved_by', 'created_at', 'updated_at', 'posted_at'),
            'classes': ('collapse',),
        }),
    )

    def total_debit(self, obj):
        return f'Rs. {obj.total_debit:,.2f}'
    total_debit.short_description = 'Amount'

    def balanced_icon(self, obj):
        if obj.is_balanced:
            return format_html('<span style="color:green">✔ Balanced</span>')
        return format_html('<span style="color:red">✘ Unbalanced</span>')
    balanced_icon.short_description = 'Balance'

    def colored_status(self, obj):
        colors = {'DRAFT': 'orange', 'POSTED': 'green', 'REVERSED': 'red'}
        color  = colors.get(obj.status, 'grey')
        return format_html(
            '<span style="color:{}; font-weight:bold">{}</span>',
            color, obj.get_status_display()
        )
    colored_status.short_description = 'Status'


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name', 'symbol', 'exchange_rate', 'is_base', 'is_active', 'updated_at']
    list_editable = ['exchange_rate', 'is_active']
    search_fields = ['code', 'name']


@admin.register(RecurringSchedule)
class RecurringScheduleAdmin(admin.ModelAdmin):
    list_display    = ['template_voucher', 'frequency', 'next_due_date', 'times_generated', 'is_active']
    list_filter     = ['frequency', 'is_active']
    readonly_fields = ['times_generated', 'last_generated']


@admin.register(VoucherAuditLog)
class VoucherAuditLogAdmin(admin.ModelAdmin):
    list_display    = ['voucher', 'action', 'performed_by', 'timestamp', 'notes']
    list_filter     = ['action']
    search_fields   = ['voucher__voucher_no']
    readonly_fields = [f.name for f in VoucherAuditLog._meta.fields]

    def has_add_permission(self, request):       return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
