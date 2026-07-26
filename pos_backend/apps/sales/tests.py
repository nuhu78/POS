from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.categories.models import Category
from apps.products.models import Product
from apps.customers.models import Customer
from .models import Sale, SaleItem, Payment


class SaleTransactionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.com", name="Admin", password="pass123", role="admin"
        )
        self.cashier = User.objects.create_user(
            email="cashier@test.com", name="Cashier", password="pass123", role="cashier"
        )
        self.cat = Category.objects.create(name="Furniture")
        self.product = Product.objects.create(
            name="Wooden Chair", sku="CHR-001", category=self.cat,
            purchase_price=50, selling_price=120, stock=10,
        )
        self.product2 = Product.objects.create(
            name="Table", sku="TBL-001", category=self.cat,
            purchase_price=200, selling_price=450, stock=5,
        )
        self.customer = Customer.objects.create(name="John", phone="1234567890")

    def test_successful_sale(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/sales/", {
            "customer": self.customer.id,
            "items": [
                {"product": self.product.id, "quantity": 2},
            ],
            "discount": "10.00",
            "payment": {"method": "cash", "amount": "230.00"},
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        data = resp.data
        self.assertEqual(data["customer_name"], "John")
        self.assertEqual(data["user_name"], "Cashier")
        self.assertEqual(float(data["subtotal"]), 240.00)
        self.assertEqual(float(data["discount"]), 10.00)
        self.assertEqual(float(data["total"]), 230.00)
        self.assertIn("INV-", data["invoice_number"])
        self.assertEqual(len(data["items"]), 1)

    def test_correct_stock_decrement(self):
        self.client.force_authenticate(user=self.cashier)
        self.client.post("/api/v1/sales/", {
            "items": [{"product": self.product.id, "quantity": 3}],
            "discount": "0",
            "payment": {"method": "cash", "amount": "360.00"},
        }, format="json")
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 7)

    def test_insufficient_stock_rejected(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/sales/", {
            "items": [{"product": self.product.id, "quantity": 99}],
            "discount": "0",
            "payment": {"method": "cash", "amount": "9999.00"},
        }, format="json")
        self.assertEqual(resp.status_code, 400)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)

    def test_server_computed_totals(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/sales/", {
            "items": [{"product": self.product.id, "quantity": 1}],
            "discount": "0",
            "subtotal": "1.00",
            "total": "1.00",
            "payment": {"method": "cash", "amount": "120.00"},
        }, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_multiple_items_sale(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/sales/", {
            "items": [
                {"product": self.product.id, "quantity": 1},
                {"product": self.product2.id, "quantity": 2},
            ],
            "discount": "20.00",
            "payment": {"method": "card", "amount": "1000.00"},
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(float(resp.data["subtotal"]), 120 + 900)
        self.assertEqual(float(resp.data["total"]), 1000.00)

    def test_zero_stock_rejected(self):
        self.product.stock = 0
        self.product.save()
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/sales/", {
            "items": [{"product": self.product.id, "quantity": 1}],
            "discount": "0",
            "payment": {"method": "cash", "amount": "120.00"},
        }, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_discount_exceeds_subtotal_rejected(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/sales/", {
            "items": [{"product": self.product.id, "quantity": 1}],
            "discount": "500.00",
            "payment": {"method": "cash", "amount": "120.00"},
        }, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_payment_amount_mismatch_rejected(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/sales/", {
            "items": [{"product": self.product.id, "quantity": 1}],
            "discount": "0",
            "payment": {"method": "cash", "amount": "1.00"},
        }, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_invoice_number_format(self):
        self.client.force_authenticate(user=self.cashier)
        resp = self.client.post("/api/v1/sales/", {
            "items": [{"product": self.product.id, "quantity": 1}],
            "discount": "0",
            "payment": {"method": "cash", "amount": "120.00"},
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        inv = resp.data["invoice_number"]
        self.assertRegex(inv, r"^INV-\d{4}-\d{6}$")

    def test_invoice_number_increments(self):
        self.client.force_authenticate(user=self.cashier)
        r1 = self.client.post("/api/v1/sales/", {
            "items": [{"product": self.product.id, "quantity": 1}],
            "discount": "0",
            "payment": {"method": "cash", "amount": "120.00"},
        }, format="json")
        r2 = self.client.post("/api/v1/sales/", {
            "items": [{"product": self.product2.id, "quantity": 1}],
            "discount": "0",
            "payment": {"method": "cash", "amount": "450.00"},
        }, format="json")
        seq1 = int(r1.data["invoice_number"].split("-")[-1])
        seq2 = int(r2.data["invoice_number"].split("-")[-1])
        self.assertEqual(seq2, seq1 + 1)
