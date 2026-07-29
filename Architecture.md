# Architecture.md — Gift Shop & Furniture POS System

## 1. Overview

A single-shop POS system with a Django REST Framework backend, a React + Vite SPA frontend, and PostgreSQL as the datastore. Deployed on Render's free tier.

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────────┐        SQL        ┌──────────────┐
│  React + Vite     │ ───────────────────────▶ │  Django REST         │ ────────────────▶ │ PostgreSQL   │
│  (SPA, Render      │ ◀─────────────────────── │  Framework (Render    │ ◀──────────────── │ (Render      │
│  Static Site)       │        JWT auth          │  Web Service)         │                   │ Postgres)    │
└─────────────────┘                          └──────────────────────┘                   └──────────────┘
```

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend framework | Django + Django REST Framework | REST API only, no server-rendered templates |
| Auth | `djangorestframework-simplejwt` | Access + refresh tokens, role claim in payload |
| Frontend | React 18 + Vite | SPA, calls API via `axios` |
| Database | PostgreSQL | Render managed Postgres (free tier) |
| Static/media | WhiteNoise (backend static) | Render free-tier disk is ephemeral — don't rely on local file storage for anything persistent (e.g. uploaded product images); use a free object-storage tier (Cloudinary) if that's ever needed |
| Excel handling | `openpyxl` | Product import/export (.xlsx) |
| Deployment | Render Web Service (backend) + Render Static Site (frontend) | Two separate Render services |
| Env config | `django-environ` / `.env` | Never commit secrets |

## 3. Backend Structure (Django apps)

One Django app per bounded context — this maps cleanly onto the phases in `Phase.md` and keeps AI-assisted generation scoped per app.

```
pos_backend/
├── config/                 # project settings, urls, wsgi/asgi
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── accounts/            # Users, roles, auth (login/logout/change password)
│   ├── categories/          # Category CRUD
│   ├── products/            # Product CRUD, stock, low-stock logic
│   ├── customers/           # Customer CRUD, purchase history
│   ├── sales/               # Cart → Sale → Sale_Items → Payments
│   ├── invoices/            # Invoice generation
│   ├── reports/             # Daily/monthly/product/best-seller reports
│   └── shop_settings/       # Shop info, tax %, currency, receipt footer
├── manage.py
└── requirements.txt
```

Each app follows the standard DRF layout: `models.py`, `serializers.py`, `views.py` (ViewSets), `permissions.py`, `urls.py`.

## 4. Frontend Structure (React + Vite)

```
pos_frontend/
├── src/
│   ├── api/                 # axios instance, per-resource API modules
│   ├── auth/                 # AuthContext, ProtectedRoute, role guards
│   ├── components/           # shared UI (Button, Table, Modal, Toast)
│   ├── features/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── customers/
│   │   ├── pos/              # cart screen, cashier flow
│   │   ├── invoices/
│   │   ├── reports/
│   │   └── settings/
│   ├── layouts/               # AdminLayout, CashierLayout
│   ├── routes/                # React Router config, role-based routing
│   └── main.jsx
├── vite.config.js
└── package.json
```

## 5. API Design

- RESTful resource routing via DRF `routers.DefaultRouter()`, one router per app, mounted under `/api/v1/<resource>/`.
- Example endpoints: `/api/v1/products/`, `/api/v1/sales/`, `/api/v1/reports/daily/`.
- Pagination: DRF `PageNumberPagination` for list endpoints (products, customers, sales history).
- Filtering/search: `django-filter` + DRF `SearchFilter` for product/customer search.
- Nested writes: a `Sale` create request accepts a payload with `items: [...]` and `payment: {...}`; the serializer creates `Sale`, `SaleItem` rows, and `Payment` in one DB transaction (`transaction.atomic`) and decrements product stock.
- Product import/export: `GET /api/v1/products/export/` returns an `.xlsx` workbook with all products; `POST /api/v1/products/import/` accepts an `.xlsx` file and creates-or-updates products by SKU in a single atomic transaction with a JSON summary response.

## 6. Auth Flow

1. Frontend POSTs credentials to `/api/v1/auth/login/` → receives access + refresh JWT.
2. Access token kept in memory (not `localStorage`, to reduce XSS exposure); refresh handled via a silent-refresh call before expiry.
3. Every API request attaches `Authorization: Bearer <access_token>`.
4. DRF permission classes check role (`IsAdmin`, `IsCashier`) per view, mirroring the Admin/Cashier capability split in the requirements doc.
5. Logout blacklists the refresh token (`rest_framework_simplejwt.token_blacklist`).

## 7. Data Flow: A Sale (POS transaction)

```
Cashier searches product   (GET /products/?search=)
        ↓
Frontend builds cart in local React state
        ↓
POST /sales/  { customer_id, items:[{product_id, qty}], discount, payment:{method, amount} }
        ↓
Django: atomic transaction
   ├─ create Sale
   ├─ create SaleItem rows, validate stock ≥ qty
   ├─ decrement Product.stock
   ├─ create Payment
   └─ compute subtotal/discount/total server-side (never trust client-sent totals)
        ↓
Response: Sale object + generated invoice_number
        ↓
Frontend renders/prints invoice, resets cart
```

## 8. Deployment Architecture (Render free tier)

- **Backend**: Render Web Service, `gunicorn config.wsgi`, auto-deploy from the GitHub main branch.
- **Database**: Render PostgreSQL free instance — free-tier Postgres expires after 90 days and must be recreated/reconnected; keep `DATABASE_URL` in Render env vars, never in code.
- **Frontend**: Render Static Site, build command `npm run build`, publish directory `dist`.
- **CORS**: `django-cors-headers`, allow only the Render static site origin in production.
- **Env vars per service**: `SECRET_KEY`, `DATABASE_URL`, `DEBUG=False`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`.
- **Cold starts**: Render free web services sleep after ~15 min of inactivity — the first request after idle is slow (10–50s); worth a note in a demo so it isn't mistaken for a bug.

## 9. Non-Functional Mapping

| Requirement | Implementation |
|---|---|
| Responsive UI | Vite + mobile-first CSS (Tailwind or plain CSS) |
| Secure login | JWT + Django's default password hasher (PBKDF2) |
| Fast search | DB indexes on `Product.name`, `Product.sku`, `Customer.phone`; `SearchFilter` on indexed columns |
| Data validation | DRF serializer validation on the server, mirrored with lightweight client-side checks |
| Backup support | Free tier has no automatic backups — schedule a periodic `pg_dump` (e.g. via a GitHub Actions cron) as a manual substitute |
