# sentry.md — Error & Performance Monitoring for `pos_backend`

How to wire [Sentry](https://sentry.io) into the Django/DRF backend so that 500s, database failures, and slow requests show up in a dashboard instead of being discovered by a cashier at checkout.

Read together with `Error-Handling.md` (error shape), `Security.md` (PII rules), and `deploy.md` (Render env vars).

---

## 0. What Sentry will capture (and what it won't)

| Captured | Not captured (by design) |
|---|---|
| Unhandled Python exceptions in views/middleware | DRF 4xx responses (validation, 401, 403, 404, 409) — these are normal API behaviour |
| `logger.error()` / `logger.exception()` calls | Expected business conflicts logged at INFO/WARNING (409 insufficient stock, per `Error-Handling.md §6`) |
| Database errors (via the custom handler — see §5) | Cold-start latency on Render free tier (slow ≠ broken) |
| Uncaught exceptions during `manage.py migrate` on deploy | Request bodies, cookies, JWT tokens (scrubbed — see §7) |
| Performance traces (slow endpoints) at a sampled rate | Local dev noise (Sentry only initializes with prod settings — §3) |

---

## 1. Create the Sentry project

1. Sign up at <https://sentry.io> (free tier is enough for a single-shop POS).
2. **Create project** → platform **Django** → name it `ai-pos-backend`.
3. Skip the wizard's code snippet — the setup below matches this repo's structure.
4. Copy the **DSN** (Settings → Projects → `ai-pos-backend` → Client Keys (DSN):
   ```
   https://abcdef0123456789abcdef0123456789@o123456.ingest.sentry.io/1234567
   ```
   The DSN is not a secret (it only allows *sending* events), but keep it in env vars anyway — never commit it.

---

## 2. Install the SDK

```bash
pip install "sentry-sdk[django]>=2.0"
```

Add to `pos_backend/requirements.txt`:

```
sentry-sdk[django]>=2.0
```

The `[django]` extra pulls in the Django integration (auto-instruments views, middleware, ORM). Sentry ships a logging integration by default, so `logger.exception(...)` in `config/exceptions.py` is reported automatically.

---

## 3. Initialize the SDK

Create **`pos_backend/config/sentry.py`**:

```python
import logging

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

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
        send_default_pii=False,   # never attach request bodies / user IPs
        max_breadcrumbs=50,
        before_send=_before_send,
        shutdown_timeout=5,       # flush events before gunicorn worker exits
    )
```

Append to **`pos_backend/config/settings/prod.py`** (bottom of the file):

```python
if env("SENTRY_DSN", default=""):
    from config.sentry import init_sentry

    init_sentry(
        dsn=env("SENTRY_DSN"),
        environment=env("SENTRY_ENVIRONMENT", default="production"),
        release=env.str("SENTRY_RELEASE", None),
        traces_sample_rate=env.float("SENTRY_TRACES_SAMPLE_RATE", 0.1),
    )
```

> **django-environ gotcha**: the *second positional* argument of `env()` is `cast`, **not** `default`. `env("SENTRY_DSN", "")` raises `TypeError: 'str' object is not callable` at startup. Always use the keyword: `env("SENTRY_DSN", default="")`.

Why here and not in `base.py`:

- **Dev stays clean** — local runs (`config.settings.dev`) never send events, so tests and `runserver` don't pollute the project.
- **Init runs at settings import**, which happens before gunicorn serves traffic *and* before `manage.py migrate` in the Render start command — so a failing migration on deploy is also reported.

### 3.1 Two tabs: Issues vs Logs (why the UI can look empty)

Sentry splits ingestion into separate products — they do **not** all populate from one source:

| Sentry tab | Fed by | This project's source |
|---|---|---|
| **Issues** | uncaught exceptions + `logger.error` / `logger.exception` (`event_level=ERROR`) | DRF 500s via `_capture_server_error`, the `logger.exception` fallback, `DatabaseError` |
| **Logs** | every log record ≥ `sentry_logs_level` (INFO) — needs `enable_logs=True` | `logger.info/warning/error` anywhere in `config/` and `apps/` |
| **Explore / Performance** | transactions, sampled at `traces_sample_rate` | 10 % of requests |
| **Releases / Environments** | `SENTRY_RELEASE`, `SENTRY_ENVIRONMENT` | Render commit SHA + `production` |

Four reasons an empty screen is usually a false alarm:

1. **Wrong tab** — Logs only shows `logger.*` output; Issues only shows errors. Neither fills up if nothing was logged/failed yet.
2. **`enable_logs` defaults to `false`** in sentry-sdk 2.x — without it in `init()`, the Logs tab stays empty forever (now set in `config/sentry.py`).
3. **Python silently drops INFO** — the root logger defaults to `WARNING`, so `logger.info(...)` never reaches *any* handler, not even the console. `config/settings/base.py` now defines `LOGGING` with `root: level=INFO` (which also prints app logs into Render's Logs tab).
4. **No 5xx has happened yet** — 4xx responses are intentionally silent (§5). Test with the `_sentry-test` route from §9, not with a bad request payload.

Also check the **environment filter** at the top of the page: with `SENTRY_ENVIRONMENT=production`, events are tagged `production` — selecting a non-existent environment hides everything.

---

## 4. Environment variables

### Local (`pos_backend/.env`) — optional, only if you want to test Sentry locally

```env
SENTRY_DSN=https://abcdef0123456789abcdef0123456789@o123456.ingest.sentry.io/1234567
SENTRY_ENVIRONMENT=local
SENTRY_TRACES_SAMPLE_RATE=1.0
```

Also add the empty keys to the root `.env.example`:

```env
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Render (Backend service → Environment Variables)

| Key | Value | Notes |
|---|---|---|
| `SENTRY_DSN` | your project DSN | required to enable monitoring |
| `SENTRY_ENVIRONMENT` | `production` | shown on every event — distinguishes prod from local |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | 10 % of requests traced; free tier has a small span quota |
| `SENTRY_RELEASE` | `$RENDER_GIT_COMMIT` | Render exposes the commit SHA — groups issues per deploy |

Add these **after** the vars listed in `deploy.md §2.3`. Render redeploys automatically on save.

---

## 5. Wire it into the custom DRF exception handler (critical)

**The problem:** DRF catches exceptions inside the view and converts them to a `Response` — the exception never reaches Django, so Sentry sees nothing. Worse, `config/exceptions.py` *always* returns a `Response` (the fallback at `config/exceptions.py:67-70`), so even non-DRF exceptions are swallowed.

Result without changes:

- DRF-handled **5xx** (e.g. the `DatabaseError` branch at `config/exceptions.py:25-35`) → **invisible** to Sentry.
- The unhandled fallback → already reported, because `logger.exception(...)` fires an ERROR log that the `LoggingIntegration` turns into an event.

So the rule is: **capture explicitly only where no ERROR-level log is emitted, and never capture 4xx.**

Already wired in **`pos_backend/config/exceptions.py`**:

```python
import sentry_sdk


def _set_sentry_user(request):
    try:
        user = getattr(request, "user", None)   # DRF may re-raise AuthenticationFailed here
    except Exception:
        return
    if user is not None and getattr(user, "is_authenticated", False):
        sentry_sdk.set_user({"id": user.pk, "email": user.email})


def _capture_server_error(exc, request):
    _set_sentry_user(request)
    sentry_sdk.capture_exception(exc)


def custom_exception_handler(exc, context):
    ...
    if isinstance(exc, DatabaseError):
        _set_sentry_user(request)
        logger.exception(                      # was: logger.error(..., exc) — now carries exc_info
            "Database error on %s %s",
            request.method if request else "N/A",
            request.path if request else "N/A",
        )
        return Response({"error": {...}}, status=500)

    response = exception_handler(exc, context)
    if response is not None:
        ...
        response.data = {"error": error}

        if response.status_code >= 500:
            _capture_server_error(exc, request)   # DRF swallowed it — report it explicitly

        return response

    _set_sentry_user(request)
    logger.exception("Unhandled exception", exc_info=exc)   # captured by LoggingIntegration
    return Response({"error": {...}}, status=500)
```

The rules it implements:

| Path | Reported? | Why |
|---|---|---|
| `logger.exception` on `DatabaseError` / unhandled fallback | ✅ automatically | `event_level=logging.ERROR` turns the record (with traceback) into an event |
| DRF response with `status >= 500` | ✅ explicitly | DRF swallowed the exception — no ERROR log would ever fire |
| 4xx responses (400/401/403/404/409) | ❌ never | Expected API behaviour; per `Error-Handling.md`, 409/401 are normal flows |

**Do not** add `capture_exception` next to `logger.exception("Unhandled exception", ...)` — that would send the same error twice and burn quota. One path, one event.

**Do not** report 401/403/404/409/400. Per `Error-Handling.md`, 409 (insufficient stock) and 401 (expired JWT → silent refresh) are *expected* flows; Sentry would fill with events nobody can act on.

---

## 6. User context on every event

`_set_sentry_user()` above runs before every report (500s), tagging the event with the **id + email of the authenticated JWT user** — enough to reproduce "cashier X hit a 500 during checkout" without storing request bodies.

Notes:

- The `try/except` is deliberate: DRF's `request.user` property can raise `AuthenticationFailed` while re-triggering authentication inside the handler; that must not escape and turn into a second error.
- `DjangoIntegration` already attaches the URL, method and view of the request — no extra tags needed for that.
- Never `sentry_sdk.set_extra("payload", request.data)` — sale payloads contain customer details. If you need request context, log **keys** only:
  ```python
  sentry_sdk.set_extra("payload_keys", list(request.data.keys()))
  ```

---

## 7. PII & security rules (from `Security.md`)

Defaults already protect most of it:

- `send_default_pii=False` → no request bodies, no IP-address-as-user.
- The SDK's default denylist scrubs `authorization`, `cookie`, `set-cookie`, `password`, `secret` headers/fields.

Still enforce:

- **Never** `capture_message()` / `set_extra()` with: passwords, JWT access/refresh tokens, full customer objects, card/payment details, `DATABASE_URL`.
- Never paste the DSN into source code — env var only (`.env` is git-ignored, per `Security.md`).
- If a user's email appears in an event and you must remove it: Sentry → Settings → Privacy & Data → enable **"Prevent storage of PII"** and add server-side scrubbing rules.
- Deleting an issue does not erase it before retention — treat Sentry as a place where *metadata about* the data lives, not the data itself.

---

## 8. Releases (optional but cheap)

With `SENTRY_RELEASE=$RENDER_GIT_COMMIT`, Sentry links each issue to the commit that introduced it and marks it **resolved in next release** automatically. No `sentry-cli` upload is needed for the Python backend (that's only for frontend sourcemaps).

To make it work end-to-end:

1. Set `SENTRY_RELEASE=$RENDER_GIT_COMMIT` in Render (§4).
2. Sentry → Settings → `ai-pos-backend` → Releases → confirm commits appear (requires the GitHub integration).

---

## 9. Verify the integration

**Option A — smoke test from a shell** (with `SENTRY_DSN` set in `pos_backend/.env`):

```powershell
cd pos_backend
$env:DJANGO_SETTINGS_MODULE="config.settings.prod"
py manage.py shell
>>> import sentry_sdk
>>> sentry_sdk.capture_message("Sentry smoke test from pos_backend", level="error")
```

Event appears in Sentry within ~5 s.

**Option B — the built-in test route** (tests the §5 wiring):

The repo ships a temporary route `GET /api/v1/sentry-test/` in `config/urls.py` — it logs one `INFO` line and then raises `ValueError`. Hit it on the deployed backend:

```bash
curl -i https://ai-pos-backend.onrender.com/api/v1/sentry-test/
```

Expected in Sentry within ~5 s:

| Tab | Entry |
|---|---|
| **Issues** | `ValueError: Sentry test error: this issue should appear in Sentry > Issues` (1 event, `environment: production`) |
| **Logs** | `INFO … Sentry test: INFO log line should appear in the Logs tab` + the `Unhandled exception` error line |

The HTTP response is still the normal `{"error": {"code": "SERVER_ERROR", …}}` with status 500 — the route never leaks a traceback.

> **Remove the route** (`config/urls.py` → `sentry_test`) once you have confirmed both tabs populate; it is unauthenticated and would otherwise let anyone create noise.

**Option C — force a DatabaseError**: temporarily point `DATABASE_URL` at a bad host and hit any endpoint; confirm the event arrives with a traceback (the §5 `logger.exception` change).

> **Capture paths already verified locally** while wiring this up: a 4xx validation error → **0 events**; a DRF-handled 500 and an unhandled `ValueError` → **exactly 1 event each** (no duplicates).

Checklist:

- [ ] Event shows `environment: production` and `release: <commit sha>`
- [ ] Issue has the Python traceback and the offending URL
- [ ] No `Authorization` header or request body visible in the event
- [ ] An ordinary 409 (insufficient stock) does **not** create an issue
- [ ] `GET /api/v1/ping/` still returns `{"status":"ok"}` (no regression)

---

## 10. Alerts

Sentry → **Alerts → Create Alert**:

| Alert | Condition | Channel |
|---|---|---|
| New 500-level issue | `A new issue is created` (filter: level = error) | Email (add Slack later) |
| Sales endpoint breaking | Issue in code path `apps.sales` | Email to admin |
| Error spike | `The number of events is above 20 in 5 minutes` | Email |
| Regressed issue | `The issue is a regression` | Email |

Default rules created with the project ("Issue Ownership", "Issue Required") are fine to keep — assign **code owners** via Sentry's `CODEOWNERS`/suspect-commits so issues route to whoever touched the file.

---

## 11. Performance tracing

- `traces_sample_rate=0.1` → 10 % of requests produce a transaction. Raise to `1.0` temporarily while debugging a slow endpoint, then put it back.
- Watch for slow endpoints in **Explore → Backend** (e.g. `POST /api/v1/sales/` under a big cart, report aggregations).
- **Render free-tier cold start** (10–50 s after 15 min idle) shows up as one very slow transaction after a quiet period — that is the platform sleeping, not a bug. Do not chase it; see `deploy.md §6`.
- gunicorn `--max-requests 1200` worker recycling is normal process churn, not an error.
- Keep `shutdown_timeout=5` so in-flight events flush before a worker exits.

---

## 12. Free-tier quota hygiene

The free plan has a monthly event cap (check **Settings → Subscription** for your current numbers). Protect it:

- `traces_sample_rate` ≤ `0.1` in production.
- No Sentry in dev/test settings (§3) — unit tests must never send events.
- `before_send` filters (§3) drop irrecoverable noise.
- Never report 4xx (§5).
- Use `sentry_sdk.set_tag`/`set_extra` for context instead of `capture_message` for control-flow logging.
- If a single issue floods: Sentry → issue → **Action → Mute**, or add a `before_send` rule for that exception type.

---

## 13. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| **Logs tab empty** | `enable_logs` not passed to `init()` (default is `false` in SDK 2.x) — see §3.1 |
| **`logger.info` missing everywhere** | Root logger still at `WARNING` — `LOGGING["root"]["level"]` in `config/settings/base.py` must be `INFO` |
| **Nothing at all, both tabs** | `SENTRY_DSN` missing/empty on Render, or the UI **environment filter** excludes `production` |
| No events at all | `SENTRY_DSN` missing/empty on Render; confirm `config.settings.prod` is the settings module (`config/wsgi.py` already sets it) |
| No events for an API error | DRF swallowed it — see §5; add `capture_exception` for `status >= 500`. 4xx are silent by design — trigger a real 500 (§9) |
| Duplicate events for one error | Both `capture_exception` **and** `logger.exception` on the same path — remove one |
| Events missing tracebacks | You used `logger.error(..., exc)` — switch to `logger.exception(...)` |
| Dev/test events appear | Something imported `init_sentry()` from `base.py` — keep it in `prod.py` only |
| Connection error: transport | Render outbound to `*.ingest.sentry.io` needs no allowlist, but a corporate proxy/VPN may block it; try from the same network |
| Deploy fails before gunicorn starts | Render **Logs** tab is the source of truth; Sentry only catches it if `SENTRY_DSN` was already set before the failed deploy |

---

## 14. Optional — uptime + frontend

- **Uptime**: Sentry → **Crons → Uptime Monitor**, poll `https://ai-pos-backend.onrender.com/api/v1/ping/` every 5 min — catches a service that is down rather than erroring.
- **Frontend**: a separate `ai-pos-frontend` project with `@sentry/react` in `pos_frontend/src/main.jsx`, DSN passed as a build-time var (`VITE_SENTRY_DSN`) in the Render Static Site env. Same rules: no auth tokens, no customer data.

---

## 15. Quick reference — files touched

| File | Change |
|---|---|
| `pos_backend/requirements.txt` | add `sentry-sdk[django]>=2.0` |
| `pos_backend/config/sentry.py` | **new** — `init_sentry()` + `before_send` filter |
| `pos_backend/config/settings/prod.py` | call `init_sentry()` when `SENTRY_DSN` is set |
| `pos_backend/config/settings/base.py` | `LOGGING` with `root: level=INFO` — without it `logger.info` never reaches Sentry |
| `pos_backend/config/exceptions.py` | `_set_sentry_user()` / `_capture_server_error()`; `logger.exception` for DB errors; `capture_exception` for DRF 5xx |
| `.env.example` | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` |
| `deploy.md` | env-var table (§2.3) + new §2.5 "Error Monitoring (Sentry)" + verify checklist |
| Render → Backend env vars | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_RELEASE` |
