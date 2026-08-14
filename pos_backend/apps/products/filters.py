import django_filters
from django.db.models import F
from .models import Product


class ProductFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(field_name="selling_price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="selling_price", lookup_expr="lte")
    stock_status = django_filters.CharFilter(method="filter_stock_status")

    class Meta:
        model = Product
        fields = ["category", "status"]

    def filter_stock_status(self, queryset, name, value):
        if value == "low":
            return queryset.filter(status="active", stock__lte=F("low_stock_threshold"))
        if value == "out":
            return queryset.filter(stock=0)
        return queryset