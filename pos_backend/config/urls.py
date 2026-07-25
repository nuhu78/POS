from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def ping(request):
    return Response({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/ping/", ping, name="ping"),
    path("api/v1/auth/", include("apps.accounts.urls")),
]
