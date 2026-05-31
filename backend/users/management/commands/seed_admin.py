"""Seed an initial administrator (idempotent). Usage:
    python manage.py seed_admin --email admin@mts.pk --password admin123 --name "System Admin"
"""
from django.core.management.base import BaseCommand
from users.models import User, Role, Status


class Command(BaseCommand):
    help = 'Create or update the initial administrator account.'

    def add_arguments(self, parser):
        parser.add_argument('--email', default='admin@mts.pk')
        parser.add_argument('--password', default='admin123')
        parser.add_argument('--name', default='System Administrator')

    def handle(self, *args, **opts):
        email = opts['email'].lower().strip()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'name': opts['name'], 'role': Role.ADMIN, 'status': Status.ACTIVE},
        )
        user.name = opts['name']
        user.role = Role.ADMIN
        user.status = Status.ACTIVE
        user.set_password(opts['password'])
        user.save()
        self.stdout.write(self.style.SUCCESS(
            f"{'Created' if created else 'Updated'} admin: {email}"
        ))
