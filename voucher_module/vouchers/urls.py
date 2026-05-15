# ══════════════════════════════════════════════
# vouchers/urls.py
# ══════════════════════════════════════════════

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoucherViewSet, CurrencyViewSet

router = DefaultRouter()
router.register(r'vouchers',   VoucherViewSet,  basename='voucher')
router.register(r'currencies', CurrencyViewSet, basename='currency')

urlpatterns = [
    path('api/', include(router.urls)),
]
