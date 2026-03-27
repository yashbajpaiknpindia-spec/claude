# BrandForge — Deployment Guide (Render Only)

Everything runs on Render — frontend AND backend. No Vercel needed.

---

## Local Development First

```bash
# 1. Unzip and install
cd brandforge
npm install

# 2. Automated setup (fills .env files + runs database setup)
node setup.js

# 3. Run locally
npm run dev
# Frontend → http://localhost:3000
# Backend  → http://localhost:3001
# Admin    → http://localhost:3000/admin (phone: 7897671348)
```

---

## Deploy to Render (Step by Step)

### Prerequisites
- GitHub account
- Render account at render.com (free)
- All 5 env vars ready (from running `node setup.js`)

---

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "BrandForge initial commit"

# Create a repo on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/brandforge.git
git push -u origin main
```

---

### Step 2 — Deploy Backend (brandforge-api)

1. Go to **render.com** → click **New +** → **Web Service**
2. Click **Connect a repository** → select your `brandforge` repo
3. Fill in these settings:

| Field | Value |
|-------|-------|
| Name | `brandforge-api` |
| Root Directory | `apps/api` |
| Runtime | **Node** |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Plan | Free (testing) or Starter $7/mo (production) |

4. Click **Advanced** → **Add Environment Variable** — add ALL of these:

```
NODE_ENV          = production
SUPABASE_URL      = https://xxx.supabase.co
SUPABASE_SERVICE_KEY = eyJ...  ← service_role key
ANTHROPIC_API_KEY = sk-ant-...
OPENAI_API_KEY    = sk-...
ADMIN_PASSWORD    = Yash@123
FRONTEND_URL      = (leave blank for now — fill after frontend deploys)
```

> ⚠️ Do NOT set PORT — Render sets it automatically

5. Click **Create Web Service**

Wait for it to deploy (~3 minutes). Copy your URL: `https://brandforge-api.onrender.com`

---

### Step 3 — Deploy Frontend (brandforge-web)

1. Go to Render → **New +** → **Web Service**
2. Connect the same `brandforge` repo
3. Fill in these settings:

| Field | Value |
|-------|-------|
| Name | `brandforge-web` |
| Root Directory | `apps/web` |
| Runtime | **Node** |
| Build Command | `npm install && npm run build` |
| Start Command | `node server.js` |
| Plan | Free (testing) or Starter $7/mo (production) |

4. Click **Advanced** → Add environment variables:

```
NODE_ENV                    = production
HOSTNAME                    = 0.0.0.0
NEXT_PUBLIC_SUPABASE_URL    = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...  ← anon key (NOT service_role)
NEXT_PUBLIC_API_URL         = https://brandforge-api.onrender.com/api
```

5. Click **Create Web Service**

Wait for deploy (~4 minutes). Copy your URL: `https://brandforge-web.onrender.com`

---

### Step 4 — Wire Them Together

**In brandforge-api on Render:**
- Go to Environment → update `FRONTEND_URL` = `https://brandforge-web.onrender.com`
- Click **Save Changes** → service redeploys automatically

**In Supabase:**
- Go to Authentication → URL Configuration
- Set **Site URL** = `https://brandforge-web.onrender.com`
- Add to **Redirect URLs** = `https://brandforge-web.onrender.com/auth/callback`

---

### Step 5 — Run the Production Config Script

```bash
node setup-prod.js
```

Enter your two Render URLs — it tells you exactly what to update where.

---

### Step 6 — Verify

| Check | Should show |
|-------|-------------|
| `https://brandforge-api.onrender.com/health` | `{"status":"ok"}` |
| `https://brandforge-web.onrender.com` | Landing page |
| `https://brandforge-web.onrender.com/admin` | Admin login |

---

## One-Click Deploy (Blueprint Method)

Alternatively, use the `render.yaml` file at the root of the project:

1. Go to render.com → **New +** → **Blueprint**
2. Connect your GitHub repo
3. Render reads `render.yaml` and creates BOTH services automatically
4. Fill in the environment variables it asks for
5. Deploy

This is the fastest method if you want both services created in one shot.

---

## Free vs Paid on Render

| | Free | Starter ($7/mo each) |
|--|------|----------------------|
| Sleep after inactivity | Yes (15 min) | Never |
| Wake-up time | ~30 seconds | Instant |
| Recommended for | Testing | Production |

**Free tier workaround:** Use UptimeRobot (free) to ping `/health` every 10 min — keeps it awake.
URL to monitor: `https://brandforge-api.onrender.com/health`

---

## Troubleshooting

**Build fails on frontend** — Check Node version is 20+. In Render → Settings → set Node version to `20.x`

**API returns CORS error** — Make sure `FRONTEND_URL` in the API service exactly matches your frontend URL (no trailing slash)

**Admin login fails** — Check `ADMIN_PASSWORD` is set in the API service environment

**"Cannot find module"** — The monorepo needs both services to run `npm install` from their own root directory. The build commands already handle this.

**Google login not working** — Add `https://brandforge-web.onrender.com/auth/callback` to your Google OAuth redirect URIs in Google Cloud Console
