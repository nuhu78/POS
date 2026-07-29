import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework.serializers import ErrorDetail
from rest_framework import status
from django.db import DatabaseError

logger = logging.getLogger(__name__)


def _clean(obj):
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean(v) for v in obj]
    if isinstance(obj, ErrorDetail):
        return str(obj)
    return obj


def custom_exception_handler(exc, context):
    request = context.get("request") if isinstance(context, dict) else None
    view = context.get("view") if isinstance(context, dict) else None

    if isinstance(exc, DatabaseError):
        logger.error(
            "Database error on %s %s: %s",
            request.method if request else "N/A",
            request.path if request else "N/A",
            exc,
        )
        return Response(
            {"error": {"code": "SERVER_ERROR", "message": "A database error occurred. Please try again."}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    response = exception_handler(exc, context)
    if response is not None:
        data = _clean(response.data)
        if isinstance(data, dict) and "code" in data and "message" in data:
            custom_code = data.pop("code", "ERROR").upper()
            custom_message = data.pop("message", "An error occurred.")
            custom_fields = data.pop("fields", data) or {}
            error = {"code": custom_code, "message": custom_message, "fields": custom_fields}
        else:
            error = {
                "code": getattr(exc, "default_code", "error").upper(),
                "message": str(data.get("detail", str(data))) if isinstance(data, dict) else str(data),
                "fields": data if isinstance(data, dict) else None,
            }

        if response.status_code == 401:
            email = ""
            if request and hasattr(request, "data"):
                email = request.data.get("email", "")
            logger.info(
                "Authentication failure — email=%s ip=%s path=%s code=%s",
                email,
                request.META.get("REMOTE_ADDR", "unknown") if request else "unknown",
                request.path if request else "N/A",
                error.get("code", "N/A"),
            )

        response.data = {"error": error}
        return response
    logger.exception("Unhandled exception", exc_info=exc)
    return Response(
        {"error": {"code": "SERVER_ERROR", "message": "Something went wrong. Please try again."}},
        status=500,
    )
