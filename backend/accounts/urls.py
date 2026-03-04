# accounts/urls.py

from django.urls import path
from .views import (
    AccountGroupListCreateView,
    AccountGroupDetailView,
    AccountCategoryListCreateView,
    AccountCategoryDetailView,
    AccountClassListCreateView,
    AccountClassDetailView,
    AccountListCreateView,
    AccountDetailView,
)

urlpatterns = [
    # Group
    path('groups/',              AccountGroupListCreateView.as_view(),    name='group-list-create'),
    path('groups/<int:pk>/',     AccountGroupDetailView.as_view(),        name='group-detail'),

    # Category
    path('categories/',          AccountCategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', AccountCategoryDetailView.as_view(),     name='category-detail'),

    # Class
    path('classes/',             AccountClassListCreateView.as_view(),    name='class-list-create'),
    path('classes/<int:pk>/',    AccountClassDetailView.as_view(),        name='class-detail'),

    # Account
    path('accounts/',            AccountListCreateView.as_view(),         name='account-list-create'),
    path('accounts/<int:pk>/',   AccountDetailView.as_view(),             name='account-detail'),
]