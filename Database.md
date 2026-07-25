# Database.md — PostgreSQL Schema

Naming follows Django conventions (singular model names, `snake_case` columns, Django auto-adds `id` PKs unless noted). All monetary fields use `DECIMAL`, never `FLOAT`.

## 1. `users` (custom Django User model, `accounts` app)

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | VARCHAR(150) | |
| email | VARCHAR(254) UNIQUE | used as login identifier |
| password | VARCHAR | Django-hashed, never plaintext |
| role | VARCHAR(20) | `admin` \| `cashier`, or a `Role` choices field |
| is_active | BOOLEAN | default true |
| date_joined | TIMESTAMP | |

## 2. `categories`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | VARCHAR(100) UNIQUE | e.g. Furniture, Gift Items, Home Decor |
| created_at | TIMESTAMP | |

## 3. `products`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| category_id | INT FK → categories.id | `on_delete=PROTECT` — don't allow deleting a category still in use |
| name | VARCHAR(200) | indexed for search |
| sku | VARCHAR(50) UNIQUE | indexed for search |
| purchase_price | DECIMAL(10,2) | |
| selling_price | DECIMAL(10,2) | |
| stock | INTEGER | default 0, `CHECK (stock >= 0)` |
| low_stock_threshold | INTEGER | default per-product, used for dashboard alert |
| status | VARCHAR(20) | `active` \| `inactive` |
| created_at, updated_at | TIMESTAMP | |

Indexes: `(name)`, `(sku)` — both searched frequently from the POS screen.

## 4. `customers`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | VARCHAR(150) | |
| phone | VARCHAR(20) UNIQUE | indexed, used for POS lookup |
| address | TEXT | nullable |
| created_at | TIMESTAMP | |

## 5. `sales`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| invoice_number | VARCHAR(30) UNIQUE | generated server-side, e.g. `INV-2026-000123` |
| customer_id | INT FK → customers.id | nullable — walk-in sales with no customer record |
| user_id | INT FK → users.id | cashier who processed the sale, `on_delete=PROTECT` |
| date | TIMESTAMP | default now |
| subtotal | DECIMAL(10,2) | computed server-side from sale_items |
| discount | DECIMAL(10,2) | default 0 |
| total | DECIMAL(10,2) | subtotal − discount, computed server-side |

## 6. `sale_items`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| sale_id | INT FK → sales.id | `on_delete=CASCADE` |
| product_id | INT FK → products.id | `on_delete=PROTECT` — preserve sales history even if a product is later deactivated |
| quantity | INTEGER | `CHECK (quantity > 0)` |
| price | DECIMAL(10,2) | snapshot of `selling_price` at time of sale — never recompute from current product price |

## 7. `payments`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| sale_id | INT FK → sales.id UNIQUE | one payment per sale for this scope (`on_delete=CASCADE`) |
| method | VARCHAR(20) | `cash` \| `card` \| `mobile_banking` (bKash/Nagad common in Bangladesh, add if relevant) |
| amount | DECIMAL(10,2) | should equal `sales.total` |

## 8. `shop_settings` (singleton table)

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | enforce single row at the application level |
| shop_name | VARCHAR(150) | |
| tax_percentage | DECIMAL(5,2) | e.g. 0.00–100.00 |
| currency | VARCHAR(10) | e.g. BDT |
| receipt_footer | TEXT | |

## 9. Relationships (ERD, text form)

```
categories (1) ───< (many) products
customers  (1) ───< (many) sales
users      (1) ───< (many) sales           [cashier who made the sale]
sales      (1) ───< (many) sale_items
products   (1) ───< (many) sale_items
sales      (1) ─── (1) payments
```

## 10. Key Design Decisions

- **Price snapshotting**: `sale_items.price` stores the price *at the time of sale*, independent of later changes to `products.selling_price`. This keeps historical invoices accurate.
- **Server-computed totals**: `sales.subtotal`/`total` are always computed in the backend transaction, never trusted from the client payload — prevents a tampered request from under-charging.
- **PROTECT vs CASCADE**: sale history should survive product/customer edits; only truly dependent rows (`sale_items` under a `sale`, `payments` under a `sale`) cascade-delete.
- **Stock check constraint**: a DB-level `CHECK (stock >= 0)` is a second line of defense behind the application-level validation in the sale-creation transaction.

## 11. Migrations Strategy

- Use Django's built-in migration system (`makemigrations` / `migrate`) — no separate migration tool needed.
- Keep one migration file per meaningful schema change; avoid squashing until the schema stabilizes post-Phase 4.
- Run `migrate` against the Render Postgres instance as part of the Render deploy step (`Build Command` or a `release` hook).
