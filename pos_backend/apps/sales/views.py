from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Sale
from .serializers import SaleSerializer


class SaleViewSet(ModelViewSet):
    queryset = Sale.objects.all().order_by("-date")
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["customer"]
    search_fields = ["invoice_number"]
