import logging

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

_NOISE = {"BrokenPipeError", "KeyboardInterrupt", "Exit"}


def _before_send(event, hint):
    if "exc_info" in hint and hint["exc_info"][0].__name__ in _NOISE:
        return None
    return event


def init_sentry(dsn, environment, release=None, traces_sample_rate=0.1):
    """Initialize Sentry. Only called from config.settings.prod when SENTRY_DSN is set."""
    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            DjangoIntegration(),
            LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR,
            ),
        ],
        environment=environment,
        release=release or None,
        traces_sample_rate=traces_sample_rate,
        send_default_pii=False,
        max_breadcrumbs=50,
        before_send=_before_send,
        shutdown_timeout=5,
    )
