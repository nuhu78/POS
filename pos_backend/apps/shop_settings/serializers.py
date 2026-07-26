from rest_framework import serializers
from .models import ShopSettings


class ShopSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopSettings
        fields = "__all__"

    def validate_shop_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Shop name cannot be empty.")
        return value.strip()

    def validate_tax_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Tax percentage must be between 0 and 100.")
        return value

    def validate_currency(self, value):
        if not value.strip():
            raise serializers.ValidationError("Currency cannot be empty.")
        if len(value.strip()) > 10:
            raise serializers.ValidationError("Currency must be 10 characters or fewer.")
        return value.strip()

    def validate_receipt_footer(self, value):
        if value and len(value) > 500:
            raise serializers.ValidationError("Receipt footer must be 500 characters or fewer.")
        return value
