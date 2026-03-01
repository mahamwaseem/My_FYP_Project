from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserProfileSerializer
from .permissions import (
    IsAdministrator, IsAccountant, IsManager,
    IsAdministratorOrManager, IsAdministratorOrAccountant, IsAnyRole
)
from .models import User

class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': RegisterSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=201)
        return Response(serializer.errors, status=400)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            token = RefreshToken(request.data['refresh'])
            token.blacklist()
            return Response({'message': 'Logged out successfully'})
        except Exception:
            return Response({'error': 'Invalid token'}, status=400)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

# --- Role Based Views (Jo URLs mein missing thi) ---

class AdminDashboardView(APIView):
    permission_classes = [IsAdministrator]
    def get(self, request):
        return Response({'message': 'Welcome Administrator'})

class AccountantView(APIView):
    permission_classes = [IsAccountant]
    def get(self, request):
        return Response({'message': 'Accountant Dashboard'})

class ManagerView(APIView):
    permission_classes = [IsManager]
    def get(self, request):
        return Response({'message': 'Manager Dashboard'})

class ReportsView(APIView):
    permission_classes = [IsAdministratorOrAccountant]
    def get(self, request):
        return Response({'message': 'Financial Reports Access'})

class ProjectsView(APIView):
    permission_classes = [IsAdministratorOrManager]
    def get(self, request):
        return Response({'message': 'Projects Management Access'})

class GeneralView(APIView):
    permission_classes = [IsAnyRole]
    def get(self, request):
        return Response({'message': 'General Access for All Roles'})