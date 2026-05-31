"""
FinTrack — Auth URL routes. Mounted at /api/auth/ ; paths match the frontend
service layer (authApi.js) exactly.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('register/',       views.RegisterView.as_view(),       name='auth-register'),
    path('login/',          views.LoginView.as_view(),          name='auth-login'),
    path('token/refresh/',  views.TokenRefreshView.as_view(),   name='auth-token-refresh'),
    path('profile/',        views.ProfileView.as_view(),        name='auth-profile'),
    path('logout/',         views.LogoutView.as_view(),         name='auth-logout'),

    # admin user management
    path('users/',              views.UserListCreateView.as_view(), name='auth-users'),
    path('users/<int:pk>/role/',   views.UserRoleView.as_view(),    name='auth-user-role'),
    path('users/<int:pk>/status/', views.UserStatusView.as_view(),  name='auth-user-status'),
    path('users/<int:pk>/password/', views.UserPasswordView.as_view(), name='auth-user-password'),
    path('change-password/',    views.ChangePasswordView.as_view(), name='auth-change-password'),
]
