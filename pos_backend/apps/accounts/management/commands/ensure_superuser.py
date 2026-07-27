from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()


class Command(BaseCommand):
    help = "Create a superuser from DJANGO_SUPERUSER_* env vars if none exists."

    def handle(self, *args, **options):
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        name = os.environ.get("DJANGO_SUPERUSER_NAME", "Admin")

        if not email or not password:
            self.stdout.write("Skipping: DJANGO_SUPERUSER_EMAIL/PASSWORD not set.")
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(f"Superuser {email} already exists — skipping.")
            return

        User.objects.create_superuser(email=email, name=name, password=password)
        self.stdout.write(self.style.SUCCESS(f"Superuser {email} created."))
