import time
import logging
from functools import wraps
from django.db import DatabaseError, OperationalError
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import RegisterSerializer, ChangePasswordSerializer, UserSerializer
from .models import User

logger = logging.getLogger(__name__)


def retry_on_db_error(max_retries=2, delay=0.5):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(*args, **kwargs):
            last_exc = None
            for attempt in range(max_retries + 1):
                try:
                    return view_func(*args, **kwargs)
                except (OperationalError, DatabaseError) as e:
                    last_exc = e
                    if attempt < max_retries:
                        logger.warning(
                            "DB error on %s, retrying (%d/%d): %s",
                            view_func.__name__, attempt + 1, max_retries, e,
                        )
                        time.sleep(delay * (2 ** attempt))
                    else:
                        logger.error(
                            "DB error on %s, all retries exhausted: %s",
                            view_func.__name__, e,
                        )
                        raise
            raise last_exc
        return wrapped
    return decorator


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    @retry_on_db_error()
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"error": {"code": "INVALID_PASSWORD", "message": "Old password is incorrect."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password changed successfully."})
