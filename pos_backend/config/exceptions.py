import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            "error": {
                "code": getattr(exc, "default_code", "error").upper(),
                "message": str(response.data.get("detail", str(response.data))),
                "fields": response.data if isinstance(response.data, dict) else None,
            }
        }
        return response
    logger.exception("Unhandled exception", exc_info=exc)
    return Response(
        {"error": {"code": "SERVER_ERROR", "message": "Something went wrong. Please try again."}},
        status=500,
    )
