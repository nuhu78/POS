from rest_framework.viewsets import ModelViewSet
from rest_framework import filters
from .models import Product
from .serializers import ProductSerializer
from .permissions import AdminOrReadOnly


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all().order_by("name")
    serializer_class = ProductSerializer
    permission_classes = [AdminOrReadOnly]
    search_fields = ["name", "sku"]
    filterset_fields = ["category", "status"]
