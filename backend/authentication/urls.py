from django.urls import path
from .views import (
    RegisterView, LogoutView, ProfileView,
    AdminDashboardView, AccountantView, ManagerView,
    ReportsView, ProjectsView, GeneralView
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('profile/', ProfileView.as_view()),

    # Role-based routes
    path('admin-dashboard/', AdminDashboardView.as_view()),  
    path('accountant/', AccountantView.as_view()),            
    path('manager/', ManagerView.as_view()),                  
    path('reports/', ReportsView.as_view()),                  # administrator + accountant
    path('projects/', ProjectsView.as_view()),                # administrator + manager
    path('general/', GeneralView.as_view()),                  # all roles
]