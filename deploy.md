# Deployment Guide — Render + Neon Postgres

## Prerequisites

- [Render](https://render.com) account (free tier)
- [Neon](https://neon.tech) account (free tier) — or any PostgreSQL provider with a `DATABASE_URL`

---

## 1. Create the Database (Neon)

1. Log in to [Neon Console](https://console.neon.tech).
2. Create a new project, name it `ai-pos`.
3. Copy the **connection string** from the dashboard — it looks like:
   ```
   postgres://user:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   This is your `DATABASE_URL`.

---

## 2. Deploy the Backend (Render Web Service)

### 2.1 Push code to GitHub

```bash
git add -A
git commit -m "ready for render deployment"
git push origin main
```

### 2.2 Create the Web Service

1. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.
2. Connect your GitHub repo.
3. Fill in the form:

| Field | Value |
|---|---|
| **Name** | `ai-pos-backend` |
| **Environment** | `Python` |
| **Field** | Value |
|---|---|---|
| **Name** | `ai-pos-backend` |
| **Environment** | `Python` |
| **Build Command** | `pip install -r requirements.txt && python manage.py collectstatic --noinput --settings=config.settings.prod` |
| **Start Command** | *(leave blank — uses `Procfile` inside `pos_backend/`)* |
| **Root Directory** | `pos_backend` |
| **Plan** | Free |

The `Procfile` lives inside `pos_backend/` and defines both the `web` (gunicorn) and `release` (migrate + superuser) commands. No need to set a separate Start Command in the dashboard.

### 2.3 Add Environment Variables

Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | The Neon connection string from step 1 |
| `SECRET_KEY` | Generate a secret: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `ALLOWED_HOSTS` | `.onrender.com,localhost` |
| `CORS_ALLOWED_ORIGINS` | Your frontend URL (e.g. `https://ai-pos-frontend.onrender.com`) — update after deploying the frontend |
| `DEBUG` | `False` |
| `DJANGO_SUPERUSER_EMAIL` | Your admin email (e.g. `admin@shop.com`) |
| `DJANGO_SUPERUSER_NAME` | `Admin` |
| `DJANGO_SUPERUSER_PASSWORD` | A strong password |

> **Important**: When you first deploy, the `CORS_ALLOWED_ORIGINS` won't be known yet. You can set a placeholder like `http://localhost:5173` and update it after the frontend is live.

### 2.4 Auto-Created Superuser

The `release` command in the `Procfile` runs `ensure_superuser` after every deploy. It reads the `DJANGO_SUPERUSER_*` env vars (set in 2.3) — creates the admin on first deploy and skips silently on subsequent ones (built-in user-exists check).

---

## 3. Deploy the Frontend (Render Static Site)

### 3.1 Create the Static Site

1. Render Dashboard → **New +** → **Static Site**.
2. Connect the same GitHub repo.
3. Fill in:

| Field | Value |
|---|---|
| **Name** | `ai-pos-frontend` |
| **Root Directory** | `pos_frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `pos_frontend/dist` |

### 3.2 Add Build Environment Variable

Under **Environment Variables** (these are injected at build time):

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | The backend URL, e.g. `https://ai-pos-backend.onrender.com/api/v1` |

Vite bakes this value into the built JS files at build time.

### 3.3 Finish & Get the URL

Once deployed, Render gives you a URL like:
```
https://ai-pos-frontend.onrender.com
```

---

## 4. Wire CORS (Final Step)

Now that you have both URLs:

1. Go to **Backend** → **Environment Variables**.
2. Update `CORS_ALLOWED_ORIGINS` to:
   ```
   https://ai-pos-frontend.onrender.com
   ```
3. Click **Save Changes** → Render will redeploy automatically.

---

## 5. Verify the Deployment

Run through this checklist:

- [ ] Visit `https://ai-pos-backend.onrender.com/api/v1/ping/` — should return `{"status":"ok"}`
- [ ] Visit `https://ai-pos-frontend.onrender.com` — login page loads
- [ ] Register a cashier account, log in, reach the POS screen
- [ ] Create an admin account via `/admin/` or `createsuperuser`, log in as admin, see dashboard
- [ ] Create a category → add a product → complete a sale → view the invoice
- [ ] Check browser console — no CORS errors

---

## 6. Cold Start Note

Render's free-tier services **sleep after ~15 minutes of inactivity**. The first request after idle takes **10–50 seconds** (cold start). The frontend should reflect this in the UI rather than showing a generic error. If you see a timeout on first load, wait ~30s and refresh.

---

## 7. Maintaining the Free Tier

| Item | Frequency | Notes |
|---|---|---|
| **Neon DB** | Every 90 days | Free-tier Postgres expires; create new DB, update `DATABASE_URL`, rerun migrations |
| **Rotate `SECRET_KEY`** | When DB is recreated | Generate a new `SECRET_KEY` and update the env var |
| **Backup** | Manually | No automatic backups on free tier — run `pg_dump` periodically via GitHub Actions cron |
