from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import User  # Custom User model

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'role', 'first_name', 'last_name')

    def create(self, validated_data):
        # Default to 'Viewer' if no role is provided
        requested_role = validated_data.pop('role', 'Viewer')

        # Security: Prevent self-assignment of 'Administrator' or 'Manager'
        if requested_role in ['Administrator', 'Manager']:
            role_to_assign = 'Viewer'
        else:
            role_to_assign = requested_role

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Assign to Django Group in SQL Server
        try:
            group = Group.objects.get(name=role_to_assign)
            user.groups.add(group)
        except Group.DoesNotExist:
            pass
            
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role', 'first_name', 'last_name']
        read_only_fields = ['role']