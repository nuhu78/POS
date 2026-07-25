# AGENTS.md — Gift Shop & Furniture POS System

## Repo state

**Planning-only.** No source code exists yet. The full spec lives in 6 `.md` files at the repo root. Read them before writing any code — they are the single source of truth for architecture, schema, error handling, security, and phased delivery.

## Key documents

| File | What it defines |
|---|---|
| `Architecture.md` | Tech stack, dir structure, API design, auth flow, data flow, deployment |
| `Database.md` | Full PostgreSQL schema (all 9 tables), field types, constraints, FK rules |
| `Error-Handling.md` | Unified error response shape, custom DRF handler, status code mapping |
| `Phase.md` | 10-phase development roadmap with exit criteria and dependencies |
| `Prompts.md` | Ready-made AI coding prompts per phase — use directly with OpenCode |
| `Security.md` | Auth, RBAC, input validation, transport/infra, logging rules |

## Project structure (defined, not yet created)

```
pos_backend/               # Django REST Framework
  config/
    settings/base.py, dev.py, prod.py
    urls.py, wsgi.py
  apps/
    accounts/              # Users, roles, JWT auth
    categories/            # Category CRUD
    products/              # Product CRUD, stock
    customers/             # Customer CRUD, purchase history
    sales/                 # Cart -> Sale -> SaleItem -> Payment
    invoices/              # Invoice generation
    reports/               # Aggregation reports
    shop_settings/         # Singleton config (tax, currency, footer)
  manage.py
  requirements.txt

pos_frontend/              # React 18 + Vite SPA
  src/
    api/                   # axios instance, per-resource modules
    auth/                  # AuthContext, ProtectedRoute, role guards
    components/            # Shared UI (Button, Table, Modal, Toast)
    features/              # dashboard, products, categories, customers, pos, invoices, reports, settings
    layouts/               # AdminLayout, CashierLayout
    routes/                # React Router, role-based routing
    main.jsx
  vite.config.js
  package.json
```

## Critical invariants (never violate)

- **Server-computed totals**: `sales.subtotal`/`total` are always computed in the backend transaction. Never trust client-sent totals — reject them.
- **Price snapshotting**: `sale_items.price` stores the selling price at time of sale, decoupled from `products.selling_price`.
- **Atomic sales**: Sale creation (validate stock -> decrement stock -> create Sale/SaleItem/Payment) runs in a single `transaction.atomic` block. Roll back entirely on any failure.
- **DB-level constraints**: `CHECK (stock >= 0)`, `CHECK (quantity > 0)`. Application validation is the first line, DB constraints are the second.
- **`on_delete=PROTECT`** on `products.category_id`, `sale_items.product_id`, `sales.user_id`. Only `sale_items.sale_id` and `payments.sale_id` use `CASCADE`.
- **Monetary fields**: Always `DECIMAL`, never `FLOAT`.
- **Error shape**: Every API error returns `{"error": {"code": "...", "message": "...", "fields": {...}}}` — registered via a custom DRF exception handler.
- **401 on expired JWT** triggers frontend silent refresh; `409` for business-rule conflicts (insufficient stock), not `400`.
- **Access tokens in memory**, not `localStorage`/`sessionStorage`.
- **Role check from DB**, not JWT claim, for sensitive actions (delete product, etc.).

## Development workflow

1. Follow `Phase.md` order — one phase at a time, review + test before the next.
2. Use prompts from `Prompts.md` with OpenCode, always attaching `Architecture.md`, `Database.md`, and `Security.md` as context.
3. Run `makemigrations` / `migrate` per app. Keep one migration per meaningful schema change.
4. Write tests for each domain-specific error case (`error.code` + status code) per `Error-Handling.md §7`.

## Tech stack defaults

| Category | Choice |
|---|---|
| Python / Django | `pos_backend/`, Python 3, DRF, djangorestframework-simplejwt, django-filter |
| JS / Frontend | `pos_frontend/`, React 18, Vite, axios, React Router |
| Database | PostgreSQL (local dev + Render Postgres in prod) |
| Deployment | Render Web Service (backend, gunicorn) + Render Static Site (frontend, `dist/`) |
| Env config | django-environ, `.env` (never committed) |

## Render-specific notes

- Free-tier Postgres **expires after 90 days** — must be recreated and reconnected.
- Render free web services **sleep after ~15 min idle** — first request after idle takes 10–50s (cold start).
- Frontend should show a "waking server" state rather than a generic error on cold-start timeout.
- Set `SECURE_PROXY_SSL_HEADER` because Render terminates TLS at the edge.
- Rotate `SECRET_KEY` and JWT signing keys when Postgres is recreated.
