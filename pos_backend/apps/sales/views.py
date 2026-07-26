from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Sale
from .serializers import SaleSerializer
from apps.shop_settings.models import ShopSettings


class SaleViewSet(ModelViewSet):
    queryset = Sale.objects.all().order_by("-date")
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["customer"]
    search_fields = ["invoice_number"]

    @action(detail=True, methods=["get"])
    def invoice(self, request, pk=None):
        sale = self.get_object()
        serializer = self.get_serializer(sale)
        data = serializer.data
        shop = ShopSettings.get()
        data["shop"] = {
            "shop_name": shop.shop_name,
            "currency": shop.currency,
            "tax_percentage": str(shop.tax_percentage),
            "receipt_footer": shop.receipt_footer,
        }
        return Response(data)
