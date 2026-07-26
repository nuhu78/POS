from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    path("daily/", views.DailySalesView.as_view(), name="daily-sales"),
    path("monthly/", views.MonthlySalesView.as_view(), name="monthly-sales"),
    path("products/", views.ProductSalesView.as_view(), name="product-sales"),
    path("best-sellers/", views.BestSellersView.as_view(), name="best-sellers"),
]
