from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    
    ROLE_CHOICES = (
        ('administrator', 'Administrator'),
        ('accountant', 'Accountant'),
        ('manager', 'Manager'),
    )
    
    phone = models.CharField(max_length=15, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='manager')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_administrator(self):
        return self.role == 'administrator'

    @property
    def is_accountant(self):
        return self.role == 'accountant'

    @property
    def is_manager(self):
        return self.role == 'manager'