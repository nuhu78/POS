from django.test import TestCase
from rest_framework.test import APIClient
from .models import User


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.com", name="Admin", password="adminpass123", role="admin"
        )
        self.cashier = User.objects.create_user(
            email="cashier@test.com", name="Cashier", password="cashpass123", role="cashier"
        )

    def test_login_admin(self):
        resp = self.client.post("/api/v1/auth/login/", {
            "email": "admin@test.com", "password": "adminpass123"
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)

    def test_login_cashier(self):
        resp = self.client.post("/api/v1/auth/login/", {
            "email": "cashier@test.com", "password": "cashpass123"
        })
        self.assertEqual(resp.status_code, 200)

    def test_login_invalid_credentials(self):
        resp = self.client.post("/api/v1/auth/login/", {
            "email": "admin@test.com", "password": "wrongpass"
        })
        self.assertEqual(resp.status_code, 401)

    def test_register_new_user(self):
        resp = self.client.post("/api/v1/auth/register/", {
            "name": "New User",
            "email": "new@test.com",
            "password": "newpass123",
            "role": "cashier",
        })
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(User.objects.filter(email="new@test.com").exists())

    def test_register_duplicate_email(self):
        self.client.post("/api/v1/auth/register/", {
            "name": "New", "email": "newdup@test.com", "password": "newpass123", "role": "cashier",
        })
        resp = self.client.post("/api/v1/auth/register/", {
            "name": "New Dup", "email": "newdup@test.com", "password": "newpass123", "role": "cashier",
        })
        self.assertEqual(resp.status_code, 400)

    def test_change_password(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post("/api/v1/auth/change-password/", {
            "old_password": "adminpass123",
            "new_password": "newadminpass123",
        })
        self.assertEqual(resp.status_code, 200)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password("newadminpass123"))

    def test_change_password_wrong_old(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post("/api/v1/auth/change-password/", {
            "old_password": "wrong",
            "new_password": "newadminpass123",
        })
        self.assertEqual(resp.status_code, 400)

    def test_admin_can_access_admin_endpoint(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get("/api/v1/products/")
        self.assertEqual(resp.status_code, 200)

    def test_unauthenticated_access_denied(self):
        resp = self.client.get("/api/v1/products/")
        self.assertEqual(resp.status_code, 401)
