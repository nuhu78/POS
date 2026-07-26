from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = "__all__"

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Product name cannot be empty.")
        return value.strip()

    def validate_sku(self, value):
        if not value.strip():
            raise serializers.ValidationError("SKU cannot be empty.")
        return value.strip().upper()

    def validate_purchase_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Purchase price cannot be negative.")
        return value

    def validate_selling_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Selling price cannot be negative.")
        if value == 0:
            raise serializers.ValidationError("Selling price must be greater than zero.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

    def validate_low_stock_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError("Low stock threshold cannot be negative.")
        return value

    def validate(self, data):
        if "selling_price" in data and "purchase_price" in data:
            if data["selling_price"] < data["purchase_price"]:
                raise serializers.ValidationError(
                    {"selling_price": ["Selling price should not be lower than purchase price."]}
                )
        return data
