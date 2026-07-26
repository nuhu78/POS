from rest_framework.viewsets import ModelViewSet
from .models import Category
from .serializers import CategorySerializer
from .permissions import AdminOrReadOnly


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [AdminOrReadOnly]
