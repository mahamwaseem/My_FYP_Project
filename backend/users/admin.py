from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'role', 'status', 'last_login')
    list_filter = ('role', 'status')
    search_fields = ('name', 'email')
    readonly_fields = ('password', 'created_at', 'updated_at', 'last_login')
