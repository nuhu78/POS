from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenBlacklistView,
)
from rest_framework_simplejwt.views import TokenViewBase
from .serializers import CustomTokenObtainPairSerializer
from . import views
from .views import retry_on_db_error


class CustomTokenObtainPairView(TokenViewBase):
    serializer_class = CustomTokenObtainPairSerializer

    @retry_on_db_error()
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
]
