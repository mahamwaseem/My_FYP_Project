# accounts/serializers.py

from rest_framework import serializers
from .models import AccountGroup, AccountCategory, AccountClass, Account


class AccountGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountGroup
        fields = ['id', 'location_id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Group name cannot be empty.")
        return value


class AccountCategorySerializer(serializers.ModelSerializer):
    group_id   = serializers.PrimaryKeyRelatedField(
        queryset=AccountGroup.objects.all(),
        source='group'
    )
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model  = AccountCategory
        fields = ['id', 'group_id', 'group_name', 'name', 'is_active',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'group_name', 'created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Category name cannot be empty.")
        return value

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['group_id'] = instance.group_id
        return rep


class AccountClassSerializer(serializers.ModelSerializer):
    category_id   = serializers.PrimaryKeyRelatedField(
        queryset=AccountCategory.objects.all(),
        source='category'
    )
    category_name = serializers.CharField(source='category.name',      read_only=True)
    group_name    = serializers.CharField(source='category.group.name', read_only=True)

    class Meta:
        model  = AccountClass
        fields = ['id', 'category_id', 'category_name', 'group_name',
                  'name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'category_name', 'group_name',
                            'created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Class name cannot be empty.")
        return value

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['category_id'] = instance.category_id
        return rep


# ── NEW ────────────────────────────────────────────────────────
class AccountSerializer(serializers.ModelSerializer):
    # Accept integer class_id in POST/PUT; source maps it to the FK field
    class_id      = serializers.PrimaryKeyRelatedField(
        queryset=AccountClass.objects.all(),
        source='account_class'
    )
    # Read-only convenience fields for the frontend table
    class_name    = serializers.CharField(source='account_class.name',                read_only=True)
    category_name = serializers.CharField(source='account_class.category.name',       read_only=True)
    group_name    = serializers.CharField(source='account_class.category.group.name', read_only=True)

    class Meta:
        model  = Account
        fields = ['id', 'class_id', 'class_name', 'category_name', 'group_name',
                  'name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'class_name', 'category_name', 'group_name',
                            'created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Account name cannot be empty.")
        return value

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['class_id'] = instance.account_class_id   # always return integer
        return rep