# Phase.md — Development Roadmap

Each phase is scoped so it can be handed to an AI coding tool (see `Prompts.md`) as one self-contained unit of work, then reviewed and tested before moving on.

## Phase 0 — Project Setup
- Initialize Django project + `apps/` structure; initialize Vite + React project.
- Configure PostgreSQL connection (local dev DB + Render `DATABASE_URL` for prod).
- Configure `django-environ`, `.env.example`, `.gitignore`.
- Install and configure `djangorestframework`, `django-cors-headers`, `djangorestframework-simplejwt`, `django-filter`.
- Set up base React routing, layout shells (Admin/Cashier), and an axios instance with interceptors.
- **Exit criteria**: both servers run locally, frontend can hit a `/api/v1/ping/` health-check endpoint.

## Phase 1 — Authentication & Users
- `accounts` app: custom `User` model with `role` field (`admin` / `cashier`).
- Login, logout, change-password endpoints; JWT issue/refresh/blacklist.
- Role-based permission classes (`IsAdmin`, `IsCashier`).
- Frontend: login page, `AuthContext`, protected routes, role-based redirects.
- **Exit criteria**: an admin and a cashier user can log in and are routed to the correct layout; unauthorized routes are blocked both client- and server-side.

## Phase 2 — Categories & Products
- `categories` app: CRUD.
- `products` app: CRUD, `sku` uniqueness, `stock`, `status`, category FK.
- Search endpoint (`SearchFilter` on name/SKU).
- Frontend: product list, add/edit/delete forms, category management (admin only).
- **Exit criteria**: admin can manage categories and products end-to-end; cashier can view/search but not delete.

## Phase 3 — Customers
- `customers` app: CRUD, purchase-history endpoint (joins against `sales`).
- Frontend: customer list, add/edit forms, purchase history view.
- **Exit criteria**: customer records persist and link correctly to sales created in Phase 4.

## Phase 4 — POS / Sales
- `sales` app: `Sale`, `SaleItem`, `Payment` models.
- Atomic sale-creation endpoint: validates stock, computes totals server-side, decrements inventory, creates payment record.
- Frontend: POS screen — product search, cart, quantity edit, discount, payment entry, submit.
- **Exit criteria**: a full sale can be completed from the UI and is correctly persisted with accurate stock decrement.

## Phase 5 — Invoices
- Invoice numbering scheme (e.g. `INV-{year}-{sequence}`), tied 1:1 to `Sale`.
- Invoice detail endpoint returning full line items for printing.
- Frontend: printable invoice view/component (browser print or PDF export).
- **Exit criteria**: every completed sale has a retrievable, printable invoice.

## Phase 6 — Dashboard & Reports
- `reports` app: daily sales, monthly sales, product sales, best-sellers (aggregation queries).
- Dashboard endpoint: today's sales, total products, total customers, low-stock count.
- Frontend: dashboard widgets, report views with date-range filters.
- **Exit criteria**: dashboard numbers match manual DB checks against seeded test data.

## Phase 7 — Inventory Alerts & Settings
- Low-stock threshold logic (per-product or global setting).
- `shop_settings` app: shop info, tax %, currency, receipt footer (admin only, singleton model).
- **Exit criteria**: low-stock products surface on the dashboard; settings changes reflect in invoice output (tax, footer).

## Phase 8 — Polish & Non-Functional Work
- Input validation pass across all serializers/forms.
- Responsive layout pass (mobile/tablet check for the POS screen specifically, since a cashier may use a tablet).
- Loading/empty/error states across all list views.
- Basic automated tests: model tests, serializer tests, key endpoint tests (auth, sale creation, stock decrement).

## Phase 9 — Deployment

- Provision Render Postgres, Render Web Service (backend), Render Static Site (frontend).
- Set production env vars (`SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DEBUG=False`).
- Run migrations against the Render DB, create a superuser, smoke-test the deployed flow end-to-end.
- **Exit criteria**: a stranger can open the deployed frontend URL, log in, and complete a sale.

## Phase 10 — Product Import/Export (Excel)

- Add `openpyxl` to requirements for Excel read/write.
- **Backend** (`ProductViewSet`): `GET /api/v1/products/export/` returns an `.xlsx` workbook with columns (SKU, Name, Category, Purchase Price, Selling Price, Stock, Low Stock Threshold, Status); `POST /api/v1/products/import/` accepts an uploaded `.xlsx`, reads rows, uses SKU as unique key to create-or-update, resolves category by name, skips invalid rows, and returns a summary (processed / added / updated / skipped with reasons).
- **Frontend** (`ProductsPage`): "Export Excel" button triggers browser download; "Import Excel" button opens a file picker, posts the file, then shows a Modal with the import summary.
- **Exit criteria**: an admin can download all products as `.xlsx`, edit/add rows in Excel, re-upload, and see the correct counts of new/updated/skipped rows.

## Suggested Order & Dependencies
```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10
```
Phases 2 and 3 have no dependency on each other and can be built in either order or in parallel. Everything from Phase 4 onward depends on Phases 1–3 being functional.
