from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import User 

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'role', 'first_name', 'last_name')

    def create(self, validated_data):
        # Extract requested role, default to 'Viewer' if not provided
        requested_role = validated_data.pop('role', 'Viewer')

        # Security Constraint: Only allow 'Viewer' for self-registration.
        # Manager and Administrator must be assigned by an existing Admin.
        restricted_roles = ['Administrator', 'Manager']
        
        if requested_role in restricted_roles:
            role_to_assign = 'Viewer' # Force to lowest privilege for safety
        else:
            role_to_assign = requested_role

        # Creating the user in the database
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Assign the user to the specific Group (Role) in the database
        try:
            group = Group.objects.get(name=role_to_assign)
            user.groups.add(group)
        except Group.DoesNotExist:
            # If the group doesn't exist, we don't crash, but user gets no group
            pass
            
        return user