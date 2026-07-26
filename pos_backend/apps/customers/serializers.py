import re
from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Customer name cannot be empty.")
        return value.strip()

    def validate_phone(self, value):
        if not value.strip():
            raise serializers.ValidationError("Phone number cannot be empty.")
        cleaned = re.sub(r"[\s\-\(\)]", "", value)
        if not cleaned.isdigit() or len(cleaned) < 7 or len(cleaned) > 15:
            raise serializers.ValidationError("Enter a valid phone number (7–15 digits).")
        return cleaned

    def validate_address(self, value):
        if value and len(value) > 500:
            raise serializers.ValidationError("Address must be 500 characters or fewer.")
        return value
