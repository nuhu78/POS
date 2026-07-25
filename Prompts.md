# Prompts.md — AI Coding Prompts by Phase

Use these with Claude Code / OpenCode CLI. Feed each prompt along with `Architecture.md`, `Database.md`, and `Security.md` as context so the tool stays consistent with the overall design. Work one phase at a time; review and test before starting the next.

---

## Phase 0 — Project Setup

```
Set up a new Django project called `pos_backend` with Django REST Framework,
PostgreSQL (via django-environ for config), django-cors-headers, and
djangorestframework-simplejwt. Structure it with an `apps/` directory
(accounts, categories, products, customers, sales, invoices, reports,   
shop_settings — empty apps for now except accounts). Add settings split into
base/dev/prod. Add a `/api/v1/ping/` health-check endpoint returning
{"status": "ok"}. Include a requirements.txt and .env.example.

Separately, set up a Vite + React project called `pos_frontend` with React
Router, an axios instance pointed at the backend base URL from an env
variable, and a basic layout shell with placeholder Admin and Cashier routes.
```

## Phase 1 — Authentication & Users

```
In the `accounts` app, create a custom User model extending
AbstractBaseUser/PermissionsMixin with fields: name, email (unique, used as
username), role (choices: admin, cashier), is_active, date_joined. Wire it as
AUTH_USER_MODEL. Add DRF endpoints for login (issue JWT access+refresh via
simplejwt), logout (blacklist refresh token), and change-password. Add
custom permission classes IsAdmin and IsCashier based on request.user.role.

On the frontend, build a login page, an AuthContext that stores the access
token in memory and the user's role, an axios request interceptor that
attaches the Authorization header, a silent-refresh mechanism, and
ProtectedRoute/RoleRoute components that redirect based on auth state and role.
```

## Phase 2 — Categories & Products

```
Create the `categories` app: a Category model (name unique) with full CRUD
via a DRF ModelViewSet, admin-only for create/update/delete, read-only for
cashier.

Create the `products` app: a Product model (name, sku unique, category FK,
purchase_price, selling_price, stock, low_stock_threshold, status) with
CRUD, SearchFilter on name/sku, and validation preventing negative stock or
prices. Admin can do everything; cashier can list/search/retrieve only.

On the frontend, build category management (admin) and a product list page
with search, add/edit modals, and delete (admin-gated in the UI as well as
relying on the backend permission).
```

## Phase 3 — Customers

```
Create the `customers` app: a Customer model (name, phone unique, address)
with CRUD via DRF, plus a `purchase-history` custom action on the ViewSet
that returns the customer's past Sales with line items.

On the frontend, build a customer list with search-by-phone, add/edit forms,
and a purchase-history detail view.
```

## Phase 4 — POS / Sales

```
Create the `sales` app with Sale, SaleItem, and Payment models per
Database.md (price snapshotted on SaleItem, totals computed server-side).
Build a single atomic "create sale" endpoint that: accepts
{customer_id (optional), items: [{product_id, quantity}], discount,
payment: {method, amount}}, validates stock availability for every item
inside the same transaction, decrements Product.stock, computes
subtotal/total server-side (ignore any client-sent totals), generates an
invoice_number (format INV-{year}-{zero-padded sequence}), and rolls back
entirely on any validation failure.

On the frontend, build the POS screen: product search-and-add-to-cart,
quantity editing, discount input, a payment section, and a submit action
that posts to the sale-creation endpoint and shows a clear error if stock
is insufficient.
```

## Phase 5 — Invoices

```
Add an invoice detail endpoint (GET /sales/{id}/invoice/) returning the full
Sale with nested SaleItems, Payment, and shop_settings info (tax %,
currency, footer) needed to render a receipt.

On the frontend, build a printable invoice component (use the browser's
print dialog via window.print() with print-specific CSS, or generate a PDF
client-side) shown right after a sale completes and reachable later from
sales history.
```

## Phase 6 — Dashboard & Reports

```
Create the `reports` app with endpoints for: daily sales total, monthly
sales total, product-level sales breakdown, and top-N best-selling products
— each accepting optional date-range query params and using Django ORM
aggregation (Sum, Count) rather than pulling all rows into Python.

Add a dashboard endpoint aggregating: today's total sales, total active
products, total customers, and count of products at or below
low_stock_threshold.

On the frontend, build dashboard widgets and report pages with a date-range
picker and simple charts (table view is fine if a charting library feels
like overkill for this scope).
```

## Phase 7 — Inventory Alerts & Settings

```
Add a low-stock query (Product.objects.filter(stock__lte=F('low_stock_threshold')))
exposed via the dashboard/products endpoints, and surface it clearly in the
Admin UI.

Create the `shop_settings` app as a singleton model (shop_name,
tax_percentage, currency, receipt_footer) with a GET/PUT endpoint restricted
to admin, and wire tax_percentage + receipt_footer into the invoice
rendering from Phase 5.
```

## Phase 8 — Polish & Tests

```
Add DRF serializer-level validation across all apps (no negative
prices/quantities, required fields, phone format, etc.), consistent
loading/empty/error states across all frontend list views, and a
responsive layout pass focused on the POS screen for tablet use.

Write pytest (or Django TestCase) tests covering: user auth (login,
role permissions), product CRUD permission boundaries, and the sale-creation
transaction (successful sale, insufficient-stock rejection, correct stock
decrement, correct total calculation).
```

## Phase 9 — Deployment

```
Prepare this Django + React project for Render deployment: add a
Procfile/start command for gunicorn, configure prod settings to read
DATABASE_URL, SECRET_KEY, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS from
environment variables, add WhiteNoise for static files, and add a
render.yaml (or documented manual steps) for a Web Service (backend),
Static Site (frontend, build: npm run build, publish: dist), and a
PostgreSQL instance. Confirm migrations run and a superuser can be created
as part of the deploy process.
```

## General Prompting Tips for This Project

- Always paste in the relevant section of `Database.md` when asking for a new model — this prevents field-name drift between AI-generated apps.
- Ask for one Django app (or one React feature folder) per prompt rather than the whole backend at once; smaller diffs are easier to review.
- Explicitly say "server-side computed, never trust client input" whenever a prompt touches totals/stock — this is the single most important invariant in the whole system and is worth repeating.
- After each phase, ask the AI tool to also generate/update the relevant tests before moving to the next phase.
