from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoucherViewSet, CurrencyViewSet, RecurringScheduleViewSet

router = DefaultRouter()
router.register(r'currencies', CurrencyViewSet, basename='currency')
router.register(r'recurring',  RecurringScheduleViewSet, basename='recurring')
router.register(r'',           VoucherViewSet,  basename='voucher')

urlpatterns = [
    path('', include(router.urls)),
]