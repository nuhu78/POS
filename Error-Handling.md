# Error-Handling.md

## 1. Standard Error Response Shape

Every error response from the API follows one consistent JSON shape, regardless of which app raised it:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Not enough stock for SKU-1023 (requested 5, available 2).",
    "fields": {
      "items.0.quantity": ["Requested quantity exceeds available stock."]
    }
  }
}
```

- `code`: a stable, machine-readable string the frontend can switch on (for translations, specific UI handling, etc.) — not just the HTTP status text.
- `message`: human-readable, safe to show directly to the user.
- `fields`: optional, present for validation errors — maps field path to a list of messages, mirroring DRF's default validation error shape so it's easy to bind to form fields.

## 2. Custom DRF Exception Handler

Implement a single custom exception handler (`config/exceptions.py`) registered via `REST_FRAMEWORK["EXCEPTION_HANDLER"]`, wrapping DRF's default handler so every error — validation, permission, not-found, auth, and unhandled server errors — gets reshaped into the format above before it reaches the client.

```python
def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)  # DRF default first
    if response is not None:
        response.data = {
            "error": {
                "code": getattr(exc, "default_code", "error").upper(),
                "message": str(response.data.get("detail", "An error occurred.")),
                "fields": response.data if isinstance(response.data, dict) else None,
            }
        }
        return response
    # Unhandled exception — log it, never leak the traceback to the client
    logger.exception("Unhandled exception", exc_info=exc)
    return Response(
        {"error": {"code": "SERVER_ERROR", "message": "Something went wrong. Please try again."}},
        status=500,
    )
```

## 3. HTTP Status Code Mapping

| Situation | Status | Example |
|---|---|---|
| Successful GET/PUT/PATCH | 200 | |
| Successful POST (resource created) | 201 | new Sale, new Product |
| Successful DELETE | 204 | |
| Validation error (bad input shape/values) | 400 | negative quantity, missing required field |
| Not authenticated | 401 | missing/expired JWT |
| Authenticated but not permitted | 403 | cashier attempting product delete |
| Resource not found | 404 | product id doesn't exist |
| Conflict / business-rule violation | 409 | insufficient stock, duplicate SKU |
| Unhandled server error | 500 | never expose the raw traceback |

Use 409 (not 400) specifically for business-rule conflicts like insufficient stock — it distinguishes "your request was malformed" from "your request was well-formed but conflicts with current state," which the frontend can handle differently (e.g. auto-refresh stock levels on a 409).

## 4. Domain-Specific Error Cases

| Case | Handling |
|---|---|
| Insufficient stock during sale creation | Roll back the whole transaction (`transaction.atomic`), return 409 with the specific product/SKU and available quantity |
| Duplicate SKU / phone / category name | DB `UNIQUE` constraint + serializer `validate_*` check, return 400 with a field-specific message |
| Deleting a category still referencing products | `on_delete=PROTECT` raises `ProtectedError` — catch and return 409: "Cannot delete a category with existing products." |
| Sale total mismatch (payment amount ≠ computed total) | Reject before commit, 400, "Payment amount does not match sale total." |
| Expired/invalid JWT | 401, frontend triggers silent refresh or redirects to login on refresh failure |
| Render free-tier cold start / timeout | Frontend shows a distinct "waking up the server, please wait" state rather than a generic error, triggered by a timeout longer than the normal request budget |

## 5. Frontend Error Handling

- A single axios response interceptor unwraps the `{ error: {...} }` shape and normalizes it for the UI layer.
- Field-level errors (`fields`) are mapped onto form inputs directly; non-field errors show as a toast/banner.
- 401 responses trigger one silent-refresh attempt; if that also fails, redirect to login and clear auth state.
- 409 responses on the POS screen (e.g. stock ran out between search and checkout) trigger a specific "refresh cart" prompt rather than a generic error toast, since this is a real transaction the cashier still wants to complete.
- Network failures (Render cold start, connectivity loss) are distinguished from API errors — show a retry affordance rather than treating it as a validation problem.

## 6. Logging Strategy

- Use Python's standard `logging` module, configured per environment (verbose in dev, structured/concise in prod).
- Log all 500-level errors with full context (user id, endpoint, payload keys — not full payload if it may contain sensitive data) via `logger.exception`.
- Log 409 business-rule conflicts at `INFO`/`WARNING` level (not `ERROR`) — they're expected occurrences, not bugs, and treating them as errors would drown real problems in noise.
- Never log passwords, tokens, or full JWTs, even at DEBUG level.

## 7. Testing Error Paths

- For each domain-specific case in §4, write at least one test asserting both the status code and the `error.code` value — this locks the contract the frontend depends on and catches accidental format drift when the backend is refactored.
