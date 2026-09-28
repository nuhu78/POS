from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([AllowAny])
def ping(request):
    return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([AllowAny])
def sentry_test(request):
    """TEMPORARY — delete once the issue appears in Sentry (see sentry.md §9)."""
    logger.info("Sentry test: INFO log line should appear in the Logs tab")
    raise ValueError("Sentry test error: this issue should appear in Sentry > Issues")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/ping/", ping, name="ping"),
    path("api/v1/sentry-test/", sentry_test, name="sentry-test"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/categories/", include("apps.categories.urls")),
    path("api/v1/products/", include("apps.products.urls")),
    path("api/v1/customers/", include("apps.customers.urls")),
    path("api/v1/sales/", include("apps.sales.urls")),
    path("api/v1/reports/", include("apps.reports.urls")),
    path("api/v1/shop-settings/", include("apps.shop_settings.urls")),
]
