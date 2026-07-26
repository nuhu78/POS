from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import filters
from django.db.models import F
from .models import Product
from .serializers import ProductSerializer
from .permissions import AdminOrReadOnly


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all().order_by("name")
    serializer_class = ProductSerializer
    permission_classes = [AdminOrReadOnly]
    search_fields = ["name", "sku"]
    filterset_fields = ["category", "status"]

    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        products = Product.objects.filter(
            stock__lte=F("low_stock_threshold"), status="active"
        ).order_by("stock")
        return Response(ProductSerializer(products, many=True).data)
