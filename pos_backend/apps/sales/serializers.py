from django.utils import timezone
from rest_framework import serializers
from .models import Sale, SaleItem, Payment


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = SaleItem
        fields = ["id", "product", "product_name", "product_sku", "quantity", "price"]
        read_only_fields = ["price"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "method", "amount"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    payment = PaymentSerializer()
    customer_name = serializers.CharField(source="customer.name", read_only=True, allow_null=True)
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id", "invoice_number", "customer", "customer_name",
            "user", "user_name", "date", "subtotal", "discount", "total",
            "items", "payment",
        ]
        read_only_fields = ["invoice_number", "user", "date", "subtotal", "total"]

    def validate_discount(self, value):
        if value < 0:
            raise serializers.ValidationError("Discount cannot be negative.")
        return value

    def validate(self, data):
        if "subtotal" in self.initial_data or "total" in self.initial_data:
            raise serializers.ValidationError(
                {"error": "SERVER_COMPUTED", "message": "Subtotal and total are server-computed. Do not send them."}
            )
        items_data = data.get("items", [])
        for i, item in enumerate(items_data):
            if item.get("quantity", 0) <= 0:
                raise serializers.ValidationError(
                    {f"items.{i}.quantity": ["Quantity must be greater than 0."]}
                )
        payment_data = data.get("payment", {})
        if payment_data.get("amount", 0) <= 0:
            raise serializers.ValidationError(
                {"payment.amount": ["Payment amount must be greater than 0."]}
            )
        return data

    def create(self, validated_data):
        from django.db import transaction
        from apps.products.models import Product

        items_data = validated_data.pop("items")
        payment_data = validated_data.pop("payment")
        discount = validated_data.pop("discount", 0)
        user = self.context["request"].user

        with transaction.atomic():
            subtotal = 0
            sale_items = []

            for item in items_data:
                product = Product.objects.select_for_update().get(pk=item["product"].pk)
                if product.stock < item["quantity"]:
                    raise serializers.ValidationError(
                        {
                            "code": "INSUFFICIENT_STOCK",
                            "message": f"Not enough stock for {product.sku} (requested {item['quantity']}, available {product.stock}).",
                            "fields": {f"items.{items_data.index(item)}.quantity": ["Requested quantity exceeds available stock."]},
                        }
                    )
                price = product.selling_price
                subtotal += price * item["quantity"]
                product.stock -= item["quantity"]
                product.save()
                sale_items.append(SaleItem(product=product, quantity=item["quantity"], price=price))

            total = subtotal - discount
            if total < 0:
                raise serializers.ValidationError({"discount": ["Discount cannot exceed subtotal."]})

            if payment_data["amount"] != total:
                raise serializers.ValidationError(
                    {"payment": {"amount": ["Payment amount does not match sale total."]}}
                )

            year = timezone.now().year
            prefix = f"INV-{year}-"
            last = Sale.objects.filter(invoice_number__startswith=prefix).order_by("id").last()
            seq = 1
            if last:
                seq = int(last.invoice_number.split("-")[-1]) + 1
            invoice_number = f"{prefix}{seq:06d}"

            sale = Sale.objects.create(
                customer=validated_data.get("customer"),
                user=user,
                subtotal=subtotal,
                discount=discount,
                total=total,
                invoice_number=invoice_number,
            )

            for si in sale_items:
                si.sale = sale
            SaleItem.objects.bulk_create(sale_items)

            Payment.objects.create(sale=sale, **payment_data)

            return sale
