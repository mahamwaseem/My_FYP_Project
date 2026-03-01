from rest_framework import permissions

class IsAdministrator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Administrator').exists()

class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Manager').exists()