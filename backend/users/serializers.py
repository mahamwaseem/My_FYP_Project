"""
FinTrack — Auth serializers.
"""
from rest_framework import serializers
from .models import User, Role, Status


class UserPublicSerializer(serializers.ModelSerializer):
    user_id = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'user_id', 'name', 'email', 'role', 'status', 'last_login']

    def get_user_id(self, obj):
        return f'USR-{obj.id:03d}'

    def get_last_login(self, obj):
        return obj.last_login.strftime('%Y-%m-%d %H:%M') if obj.last_login else None


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(write_only=True, required=False)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate(self, data):
        cp = data.get('confirm_password')
        if cp is not None and data['password'] != cp:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated):
        user = User(
            name=validated['name'].strip(),
            email=validated['email'],
            role=Role.VIEWER,        # self-registration → Viewer until an admin promotes
            status=Status.ACTIVE,
        )
        user.set_password(validated['password'])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class AdminCreateUserSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    role = serializers.ChoiceField(choices=Role.choices, default=Role.VIEWER)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated):
        user = User(
            name=validated['name'].strip(),
            email=validated['email'],
            role=validated.get('role', Role.VIEWER),
            status=Status.ACTIVE,
        )
        user.set_password(validated['password'])
        user.save()
        return user


class RoleUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Role.choices)


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Status.choices)


class AdminSetPasswordSerializer(serializers.Serializer):
    """Admin sets a new (temporary) password for any user."""
    password = serializers.CharField(min_length=6, write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """A signed-in user changes their own password (must supply the current one)."""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(write_only=True, required=False)

    def validate(self, data):
        cp = data.get('confirm_password')
        if cp is not None and data['new_password'] != cp:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data
