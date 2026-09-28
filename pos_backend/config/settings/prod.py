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

if "default" in DATABASES:
    DATABASES["default"]["CONN_MAX_AGE"] = 300
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"].update({
        "connect_timeout": 5,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    })

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if env("SENTRY_DSN", default=""):
    from config.sentry import init_sentry

    init_sentry(
        dsn=env("SENTRY_DSN"),
        environment=env("SENTRY_ENVIRONMENT", default="production"),
        release=env.str("SENTRY_RELEASE", None),
        traces_sample_rate=env.float("SENTRY_TRACES_SAMPLE_RATE", 0.1),
    )
