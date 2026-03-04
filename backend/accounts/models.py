# accounts/models.py

from django.db import models


class AccountGroup(models.Model):
    location_id = models.IntegerField(default=1)
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'AccountGroups'
        ordering = ['id']

    def __str__(self):
        return f"{self.id} - {self.name}"


class AccountCategory(models.Model):
    group = models.ForeignKey(
        AccountGroup,
        on_delete=models.PROTECT,
        related_name='categories',
        db_column='group_id'
    )
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'AccountCategories'
        ordering = ['id']

    def __str__(self):
        return f"{self.id} - {self.name}"


class AccountClass(models.Model):
    category = models.ForeignKey(
        AccountCategory,
        on_delete=models.PROTECT,
        related_name='classes',
        db_column='category_id'
    )
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'AccountClasses'
        ordering = ['id']

    def __str__(self):
        return f"{self.id} - {self.name}"


# ── NEW ────────────────────────────────────────────────────────
class Account(models.Model):
    account_class = models.ForeignKey(
        AccountClass,
        on_delete=models.PROTECT,
        related_name='accounts',
        db_column='class_id'
    )
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Accounts'
        ordering = ['id']

    def __str__(self):
        return f"{self.id} - {self.name}"