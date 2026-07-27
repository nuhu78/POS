from .base import *

DEBUG = False

MIDDLEWARE.insert(
    MIDDLEWARE.index("django.middleware.security.SecurityMiddleware") + 1,
    "whitenoise.middleware.WhiteNoiseMiddleware",
)

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
