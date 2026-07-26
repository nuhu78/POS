from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.categories.models import Category
from .models import Product


class ProductPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.com", name="Admin", password="pass123", role="admin"
        )
        self.cashier = User.objects.create_user(
            email="cashier@test.com", name="Cashier", password="pass123", role="cashier"
        )
        self.cat = Category.objects.create(name="Furniture")

    def test_admin_can_create_product(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post("/api/v1/products/", {
            "name": "Chair", "sku": "CHR-001", "category": self.cat.id,
            "purchase_price": "50.00", "selling_price": "120.00",
            "stock": 10, "status": "active",
        })
        self.assertEqual(resp.status_code, 201)

    def test_cashier_cannot_create_product(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/products/", {
            "name": "Chair", "sku": "CHR-001", "category": self.cat.id,
            "purchase_price": "50.00", "selling_price": "120.00",
            "stock": 10, "status": "active",
        })
        self.assertEqual(resp.status_code, 403)

    def test_cashier_can_list_products(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.get("/api/v1/products/")
        self.assertEqual(resp.status_code, 200)

    def test_admin_can_delete_product(self):
        self.client.force_authenticate(user=self.admin)
        p = Product.objects.create(
            name="Chair", sku="CHR-001", category=self.cat,
            purchase_price=50, selling_price=120, stock=10,
        )
        resp = self.client.delete(f"/api/v1/products/{p.id}/")
        self.assertEqual(resp.status_code, 204)

    def test_cashier_cannot_delete_product(self):
        self.client.force_authenticate(user=self.admin)
        p = Product.objects.create(
            name="Chair", sku="CHR-001", category=self.cat,
            purchase_price=50, selling_price=120, stock=10,
        )
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.delete(f"/api/v1/products/{p.id}/")
        self.assertEqual(resp.status_code, 403)
