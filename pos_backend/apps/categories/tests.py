from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.categories.models import Category


class CategoryPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.com", name="Admin", password="pass123", role="admin"
        )
        self.cashier = User.objects.create_user(
            email="cashier@test.com", name="Cashier", password="pass123", role="cashier"
        )

    def test_admin_can_create_category(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post("/api/v1/categories/", {"name": "Furniture"})
        self.assertEqual(resp.status_code, 201)

    def test_cashier_cannot_create_category(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/categories/", {"name": "Furniture"})
        self.assertEqual(resp.status_code, 403)

    def test_cashier_can_list_categories(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.get("/api/v1/categories/")
        self.assertEqual(resp.status_code, 200)

    def test_admin_can_delete_category(self):
        self.client.force_authenticate(user=self.admin)
        cat = Category.objects.create(name="Gifts")
        resp = self.client.delete(f"/api/v1/categories/{cat.id}/")
        self.assertEqual(resp.status_code, 204)

    def test_cashier_cannot_delete_category(self):
        self.client.force_authenticate(user=self.admin)
        cat = Category.objects.create(name="Gifts")
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.delete(f"/api/v1/categories/{cat.id}/")
        self.assertEqual(resp.status_code, 403)
