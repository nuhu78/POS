import logging

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration, ignore_logger

# Host-header scanners hitting the raw Render URL produce a 400 per request;
# that is noise, not a bug (the 400 still shows up in Render's own logs).
ignore_logger("django.security.DisallowedHost")

_NOISE = {"BrokenPipeError", "KeyboardInterrupt", "Exit"}


def _before_send(event, hint):
    if "exc_info" in hint and hint["exc_info"][0].__name__ in _NOISE:
        return None
    return event


def init_sentry(dsn, environment, release=None, traces_sample_rate=0.1, logs_level=logging.INFO):
    """Initialize Sentry. Only called from config.settings.prod when SENTRY_DSN is set."""
    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            DjangoIntegration(),
            LoggingIntegration(
                level=logging.INFO,             # INFO+ become breadcrumbs
                event_level=logging.ERROR,      # ERROR+ become Issues
                sentry_logs_level=logs_level,   # INFO+ also stream to the Logs tab
            ),
        ],
        environment=environment,
        release=release or None,
        traces_sample_rate=traces_sample_rate,
        enable_logs=True,          # Logs product is OFF by default in SDK 2.x
        send_default_pii=False,
        max_breadcrumbs=50,
        before_send=_before_send,
        shutdown_timeout=5,
    )
