from datetime import date, timedelta
from django.db.models import Sum, Count, F
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.sales.models import Sale, SaleItem
from apps.products.models import Product
from apps.customers.models import Customer


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        today_sales = Sale.objects.filter(date__gte=today_start).aggregate(
            total=Sum("total"), count=Count("id")
        )
        return Response({
            "today_sales": today_sales["total"] or 0,
            "today_transactions": today_sales["count"] or 0,
            "active_products": Product.objects.filter(status="active").count(),
            "total_customers": Customer.objects.count(),
            "low_stock_products": Product.objects.filter(stock__lte=F("low_stock_threshold"), status="active").count(),
        })


class DailySalesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        since = timezone.now().date() - timedelta(days=days - 1)
        results = []
        for i in range(days):
            day = since + timedelta(days=i)
            day_start = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.min.time()))
            day_end = day_start + timedelta(days=1)
            agg = Sale.objects.filter(date__gte=day_start, date__lt=day_end).aggregate(
                total=Sum("total"), count=Count("id")
            )
            results.append({
                "date": day.isoformat(),
                "total": float(agg["total"] or 0),
                "transactions": agg["count"] or 0,
            })
        return Response(results)


class MonthlySalesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        months = int(request.query_params.get("months", 6))
        today = timezone.now().date()
        results = []
        for i in range(months - 1, -1, -1):
            first = today.replace(day=1) - timedelta(days=30 * i)
            first = first.replace(day=1)
            if first.month == 12:
                last = first.replace(year=first.year + 1, month=1)
            else:
                last = first.replace(month=first.month + 1)
            agg = Sale.objects.filter(date__gte=first, date__lt=last).aggregate(
                total=Sum("total"), count=Count("id")
            )
            results.append({
                "month": first.strftime("%Y-%m"),
                "total": float(agg["total"] or 0),
                "transactions": agg["count"] or 0,
            })
        return Response(results)


class ProductSalesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get("start")
        end_date = request.query_params.get("end")
        qs = SaleItem.objects.values(
            product_name=F("product__name"), product_sku=F("product__sku")
        ).annotate(
            total_qty=Sum("quantity"),
            total_revenue=Sum(F("quantity") * F("price")),
        ).order_by("-total_revenue")
        if start_date:
            qs = qs.filter(sale__date__gte=start_date)
        if end_date:
            qs = qs.filter(sale__date__lte=end_date)
        return Response(list(qs))


class BestSellersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        top_n = int(request.query_params.get("top", 10))
        start_date = request.query_params.get("start")
        end_date = request.query_params.get("end")
        qs = SaleItem.objects.values(
            product_name=F("product__name"), product_sku=F("product__sku")
        ).annotate(
            total_qty=Sum("quantity"),
            total_revenue=Sum(F("quantity") * F("price")),
        ).order_by("-total_qty")[:top_n]
        if start_date:
            qs = qs.filter(sale__date__gte=start_date)
        if end_date:
            qs = qs.filter(sale__date__lte=end_date)
        return Response(list(qs))
