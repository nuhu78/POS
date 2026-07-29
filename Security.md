# Security.md

## 1. Authentication

- JWT via `djangorestframework-simplejwt`: short-lived access token (e.g. 15 min), longer refresh token (e.g. 7 days).
- Passwords hashed with Django's default `PBKDF2PasswordHasher` (or switch to `Argon2PasswordHasher` — install `argon2-cffi` and add it as the first entry in `PASSWORD_HASHERS`).
- Enforce a minimum password policy via Django's built-in validators (`MinimumLengthValidator`, `CommonPasswordValidator`, etc.) on the change-password endpoint.
- On logout, blacklist the refresh token (`rest_framework_simplejwt.token_blacklist` app) so a stolen refresh token can't be reused after logout.
- Store the access token in memory on the frontend, not `localStorage`/`sessionStorage` — reduces exposure to XSS-based token theft.

## 2. Authorization (Role-Based Access Control)

- Two roles: `admin`, `cashier`, matching the requirements doc's capability split.
- Enforce at the DRF permission-class level, not just in the frontend UI — the frontend hiding a "Delete" button is a UX nicety, not a security boundary.
- Example: `products` ViewSet allows `list`/`retrieve` for both roles, but `create`/`update`/`destroy` only for `admin`.
- Never rely on a role claim inside the JWT alone for high-stakes checks if the token TTL is long — re-check `request.user.role` from the DB on sensitive actions (e.g. deleting a product), since a role change should take effect immediately, not just at next login.

## 3. Input Validation

- All validation in DRF serializers, not just in the frontend — the frontend can be bypassed entirely by calling the API directly.
- Explicit `CHECK` constraints at the DB level as a second line of defense (non-negative stock, non-negative prices, quantity > 0).
- Sanitize/validate phone numbers and email formats using DRF's built-in field validators.
- Reject any client-supplied `subtotal`/`total`/`price` field on sale creation — these are always server-computed (see Architecture.md §6, Prompts.md Phase 4).
- Validate uploaded files on import: check the file extension (`.xlsx` only), verify the content type (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`), and reject files containing macros (`.xlsm`) or any non-Excel format — never pass an unvalidated file stream to `openpyxl`.

## 4. Transport & Infra Security

- Enforce HTTPS in production (`SECURE_SSL_REDIRECT = True`, `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`) — Render terminates TLS at the edge, so also set `SECURE_PROXY_SSL_HEADER`.
- `django-cors-headers`: `CORS_ALLOWED_ORIGINS` restricted to the exact Render static-site URL in production; never `CORS_ALLOW_ALL_ORIGINS = True` outside local dev.
- `ALLOWED_HOSTS` set explicitly to the Render backend domain — never `*` in production.
- `DEBUG = False` in production settings — a `DEBUG=True` DRF error page leaks stack traces, settings, and query details.
- All secrets (`SECRET_KEY`, `DATABASE_URL`, JWT signing keys) come from Render environment variables, never committed to the repo. Keep a `.env.example` with placeholder keys only.

## 5. SQL Injection & ORM Usage

- Use the Django ORM (or parameterized `RawSQL` if ever unavoidable) exclusively — never string-format raw SQL with user input.
- Aggregation for reports (`Sum`, `Count`, `F()` expressions) stays inside the ORM rather than hand-built queries.

## 6. CSRF Considerations

- Since this is a token-based (JWT) API consumed by a separate SPA, standard Django CSRF protection for session-auth views doesn't apply to the JWT-authenticated API endpoints — but keep CSRF protection enabled for the Django admin site itself (`/admin/`), which still uses session auth.

## 7. Data Protection & Privacy

- Customer PII (name, phone, address) is only exposed to authenticated staff (admin/cashier), never a public endpoint.
- No payment card data is collected or stored in this scope (payment method is just a label — `cash`/`card`/`mobile_banking` — not card numbers), which keeps this out of PCI-DSS scope entirely. If online card processing is ever added later, hand it to a processor (Stripe, SSLCommerz, bKash gateway) rather than storing card data directly.

## 8. Rate Limiting & Abuse Prevention

- DRF throttling (`AnonRateThrottle`, `UserRateThrottle`) on the login endpoint specifically, to slow brute-force password guessing.
- Consider `django-axes` or a simple failed-login counter if this ever moves beyond a single-shop internal tool.

## 9. Logging & Auditing

- Log authentication events (login success/failure, logout) and destructive admin actions (product delete, category delete) with the acting user and timestamp — useful both for debugging and for the "who changed this" question a shop owner will eventually ask.
- Never log passwords, tokens, or full card/payment details, even at DEBUG level.

## 10. Render-Specific Notes

- Free-tier Render Postgres instances are publicly reachable by connection string but should still be restricted to the app's own env-provided credentials; don't hardcode or share the `DATABASE_URL` anywhere client-visible.
- Rotate `SECRET_KEY` and JWT signing keys if a Render Postgres instance is ever recreated (free tier expires after 90 days) — treat that recreation as a good moment to also rotate credentials.
