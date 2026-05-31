from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/coa/',      include('accounts.urls')),   # COA endpoints
    path('api/vouchers/', include('vouchers.urls')),   # Voucher endpoints
    path('api/gl/',       include('general_ledger.urls')),  # General Ledger endpoints
    path('api/reports/',  include('reports.urls')),         # Financial Statements endpoints
    path('api/templates/', include('templates.urls')),      # Voucher Templates endpoints
    path('api/reporting/', include('reporting.urls')),      # Reporting module endpoints
    path('api/auth/',      include('users.urls')),          # Authentication & RBAC endpoints
]