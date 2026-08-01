<div align="center">

# 🧾 Family POS
### Point of Sale for a Real Furniture & Gift Shop

**The vendor's POS can't sell what the shop actually sells. So I built one that can.**

[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-REST%20Framework-red?style=flat-square)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Fast%20Dev-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS%204-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/status-all%20phases%20shipped-brightgreen?style=flat-square)]()

</div>

---

## 📖 The story

My father runs a shop in Bangladesh dealing in **Regal furniture** and **RFL gift items** — two very different kinds of retail under one roof: high-value, slow-moving furniture next to fast-moving, low-cost gifts.

RFL provides its dealers with a POS system. It's fine — for RFL products. But it only holds the RFL-branded catalog, and nothing can be added to it. My father also sells **local products** — furniture and everyday goods from local makers — and those simply cannot exist inside RFL's POS.

So the shop ran two systems: RFL's POS for branded stock, and a paper ledger for everything else.

> Inventory split across two places. Invoices that never matched. Reports that didn't add up. Stock counted by hand. Prices drifting.

This project is the fix — **one system** that holds every product the shop sells, RFL and local together, with one inventory, one set of invoices, and numbers the owner can actually trust.

---

## 🆚 Why this isn't a tutorial clone

Most POS repos calculate totals in the browser and hope nothing goes wrong. This one treats money and inventory the way a real shop demands.

| Typical clone POS | This project |
|---|---|
| Totals calculated on the client | **Server-computed totals.** A request that sends `subtotal`/`total` is rejected outright (`sales/serializers.py:43`) |
| Naive stock decrement | Sale creation runs inside a single `transaction.atomic()` block with `select_for_update()` row locks — stock validated, inventory decremented, and `Sale` / `SaleItem` / `Payment` written **all-or-nothing** |
| Price read live at report time | `sale_items.price` **snapshots** the selling price at the moment of sale, so old invoices stay correct after a price change — critical for furniture |
| Validation only in the framework | DB-level `CHECK (stock >= 0)` and `CHECK (quantity > 0)` back up application checks, so an invariant survives even a buggy save |
| Ad-hoc error payloads | Every API error is a unified `{"error": {"code", "message", "fields"}}` envelope, from a custom DRF exception handler (`config/exceptions.py`) |
| Everything is a generic 400 | Business conflicts get a distinct, machine-readable code — `INSUFFICIENT_STOCK` on a short-fill sale — and DB hiccups are logged and retried with exponential backoff (`accounts/views.py:14`) |
| JWT stuffed in `localStorage` | Access + refresh tokens live **in memory only**; an axios interceptor silently refreshes on `401`, with refresh-token rotation + blacklist enabled |
| Roles trusted from the JWT | Sensitive actions re-check the role **from the database**, and foreign keys use `on_delete=PROTECT` so sale history is never silently destroyed |
| Data entry by hand | Products import/export as `.xlsx` with per-row skip reasons — built because the owner's stock sheets are literally Excel files |

---

## ✨ Features

### 🧑‍💼 For the cashier
- **POS screen** — search products by name or SKU, build a cart, edit quantities, apply a discount
- **Payments** — cash, card, or mobile banking (`bKash`-style), amount verified against the server-computed total
- **Invoices** — every sale gets an `INV-{year}-{sequence}` number and a printable receipt with shop name, tax, currency, and a customizable footer
- **Read-only catalog** — prices and stock are visible, never editable

### 📊 For the owner
- **Dashboard** — today's sales, transaction count, active products, customer count, low-stock alerts at a glance
- **Reports** — daily, monthly, product-level sales, and best-seller rankings, with date ranges
- **Products & categories** — full CRUD with SKU uniqueness, purchase/selling price, stock, and per-product low-stock thresholds
- **Excel import/export** — download the whole catalog, edit it in a spreadsheet, upload it back; the API reports rows added, updated, and skipped, with reasons
- **Customers** — records with purchase history, so repeat buyers are known
- **Settings** — a singleton config for shop name, tax percentage, currency, and receipt footer that flows straight into printed invoices

### 🔐 Roles
Two workspaces backed by a real `admin` / `cashier` role field: admins get a sidebar dashboard, cashiers get a distraction-free top nav focused on the POS.

---

## 🛠️ Tech stack

| Layer | Choice |
|---|---|
| **Backend** | Python 3 · Django 6 · Django REST Framework · djangorestframework-simplejwt · django-filter · django-environ · django-cors-headers |
| **Data** | PostgreSQL (Neon in production) · SQLite for zero-config local dev |
| **Frontend** | React 19 · Vite · Tailwind CSS 4 · axios · React Router |
| **Excel** | openpyxl (import/export) |
| **Deployment** | Render Web Service + Static Site · gunicorn · whitenoise |

---

## 🗂️ Project structure

```
pos_backend/                    # Django REST Framework
  config/
    settings/  base.py · dev.py · prod.py
    urls.py    # /api/v1/* routes + /admin/
    exceptions.py               # unified {"error": {...}} envelope
  apps/
    accounts/   # custom User, roles, JWT login/refresh/logout, register, change-password
    categories/ # category CRUD
    products/   # product CRUD, stock, low-stock alerts, .xlsx import/export
    customers/  # customer CRUD + purchase history
    sales/      # atomic Sale → SaleItem → Payment, invoice numbers
    invoices/   # printable invoice data
    reports/    # dashboard, daily/monthly sales, product sales, best sellers
    shop_settings/  # singleton shop config (name, tax, currency, footer)

pos_frontend/                   # React 18/19 + Vite SPA
  src/
    api/        # axios instance with silent-refresh interceptor + per-resource modules
    auth/       # AuthContext, ProtectedRoute, role guards
    features/   # dashboard, products, categories, customers, pos, invoices, reports, settings
    layouts/    # AdminLayout (sidebar) · CashierLayout (top nav)
    routes/     # role-based routing (/admin vs /cashier)
```

---

## 🖼️ Screenshots

> TODO: replace these with real captures.

<div align="center">

| POS screen | Printable invoice | Owner dashboard |
|:---:|:---:|:---:|
| <img width="320" alt="POS screen" src="https://github.com/user-attachments/assets/a6771645-7d31-4c7f-93f0-f4a68af0feba" /> | <img width="320" alt="Printable invoice" src="https://github.com/user-attachments/assets/e8e7f5b7-db6f-4864-b5f2-02d94188c8ed" /> | <img width="320" alt="Owner dashboard" src="https://github.com/user-attachments/assets/4a053120-a57e-47ea-b66d-34b73dde32aa" /> |

</div>

---

## 🚀 Getting started

### 1. Backend (Django API)

```bash
cd pos_backend
python -m venv venv
venv\Scripts\activate            # Windows — use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt

# Create a .env from the example (place it inside pos_backend/)
Copy-Item ..\.env.example .env   # Windows PowerShell
# cp ../.env.example .env        # macOS/Linux

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API runs at `http://localhost:8000/api/v1` — `/ping/`, `/auth/`, `/categories/`, `/products/`, `/customers/`, `/sales/`, `/reports/`, `/shop-settings/`.

### 2. Frontend (React SPA)

```bash
cd pos_frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev build points at `http://localhost:8000/api/v1` by default, so no env file is needed locally.

### 3. Production deploy

Full Render + Neon walkthrough (build commands, env vars, CORS, cold-start notes, free-tier maintenance) lives in [`deploy.md`](deploy.md).

---

## 🎮 Demo

**Live app:** `https://ai-pos-frontend.onrender.com>` 

Demo accounts (also shown on the login page):

| Role | Email | Password |
|---|---|---|
| 👑 Admin | `admin@pos.com` | `admin123` |
| 🧾 Cashier | `cashier@pos.com` | `cashier123` |

> ⏳ **Heads up:** the free-tier backend sleeps after ~15 min of inactivity. The first request after idle takes 10–50s to wake up — the app shows a "waking server" message instead of a generic error.

---

## 📚 Tests & documentation

Per-app test files (`accounts/tests.py`, `products/tests.py`, `sales/tests.py`, ...) cover auth, serialization, and the atomic sale / stock-decrement path.

The design is documented up front and enforced in code:

| Doc | Contents |
|---|---|
| [`Architecture.md`](Architecture.md) | Tech stack, API design, auth flow, data flow |
| [`Database.md`](Database.md) | Full PostgreSQL schema, constraints, FK rules |
| [`Error-Handling.md`](Error-Handling.md) | Unified error shape, status mapping |
| [`Security.md`](Security.md) | Auth, RBAC, validation, logging rules |
| [`Phase.md`](Phase.md) | 10-phase roadmap the build followed |

---

## ✅ Status

All planned phases are built — authentication and roles, catalog, customers, atomic POS sales, printable invoices, dashboard and reports, low-stock alerts and shop settings, Excel import/export — and the app is deployable to Render + Neon.

**What's next:** live deployment of the family shop, barcode/QR scanning on the POS screen, offline-tolerant checkout for unreliable internet, and printed receipt formatting.
