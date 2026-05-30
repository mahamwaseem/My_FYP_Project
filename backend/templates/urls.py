from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoucherTemplateViewSet

router = DefaultRouter()
router.register(r'', VoucherTemplateViewSet, basename='template')

urlpatterns = [
    path('', include(router.urls)),
]
