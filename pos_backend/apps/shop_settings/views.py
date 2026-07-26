from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ShopSettings
from .serializers import ShopSettingsSerializer


class ShopSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = ShopSettings.get()
        return Response(ShopSettingsSerializer(settings).data)

    def put(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Admin access required."}, status=403)
        settings = ShopSettings.get()
        serializer = ShopSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
