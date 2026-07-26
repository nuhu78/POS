from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import filters
from .models import Customer
from .serializers import CustomerSerializer
from .permissions import AdminOrReadOnly


class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.all().order_by("name")
    serializer_class = CustomerSerializer
    permission_classes = [AdminOrReadOnly]
    search_fields = ["name", "phone"]

    @action(detail=True, methods=["get"])
    def purchase_history(self, request, pk=None):
        customer = self.get_object()
        sales = customer.sales.all().order_by("-date")[:50]
        data = []
        for sale in sales:
            items = sale.items.all().values("product__name", "quantity", "price")
            data.append({
                "id": sale.id,
                "invoice_number": sale.invoice_number,
                "date": sale.date,
                "total": sale.total,
                "items": list(items),
            })
        return Response(data)
