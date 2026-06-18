# OBX Season 5 Ticket Tracker — Full Setup Guide

A website that shows live/not-live ticket status + email & text alerts when
Outer Banks S5 premiere tickets appear on GoFobo or Tudum.

---

## What you'll need accounts for (all free)
| Service | What it does | Free tier |
|---------|-------------|-----------|
| [Vercel](https://vercel.com) | Hosts the website | Unlimited for personal |
| [Supabase](https://supabase.com) | Stores signups + status | 500MB, more than enough |
| [Resend](https://resend.com) | Sends emails | 3,000/month |
| [Twilio](https://twilio.com) | Sends texts | ~$15 trial credit (~1,500 texts) |
| [GitHub](https://github.com) | Hosts your code for Vercel | Free |
| [Railway](https://railway.app) | Runs the Python tracker 24/7 | $5/mo hobby tier |

---

## Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Once created, go to **SQL Editor → New Query**
3. Paste the contents of `supabase-schema.sql` and click **Run**
4. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Set up Resend (email)

1. Go to [resend.com](https://resend.com) → Sign up
2. Go to **API Keys → Create API Key** → copy it → `RESEND_API_KEY`
3. Go to **Domains → Add Domain** and add your domain (or use their free `@resend.dev` sandbox for testing)
4. In `pages/api/alert.js`, update the `from` field:
   ```js
   from: 'OBX Alerts <alerts@yourdomain.com>'
   ```

---

## Step 3 — Set up Twilio (texts)

1. Go to [twilio.com](https://twilio.com) → Sign up
2. From the Console Dashboard, copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`
3. Go to **Phone Numbers → Get a Number** (free with trial) → copy it → `TWILIO_PHONE_NUMBER`

> **Note:** With a Twilio trial, you can only text numbers you've verified. To text anyone, upgrade to a paid account (~$1/mo for the number + $0.0079/text).

---

## Step 4 — Deploy to Vercel

1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/yourusername/obx-tracker.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo

3. In **Environment Variables**, add all the values from `.env.local.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   RESEND_API_KEY
   TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN
   TWILIO_PHONE_NUMBER
   ALERT_SECRET        ← make up any random string, e.g. "obx-pogue-life-2025"
   ```

4. Click **Deploy**. Your site will be live at `https://your-project.vercel.app`

---

## Step 5 — Configure the Python tracker

Open `tracker.py` and update the top two lines:
```python
SITE_URL = "https://your-project.vercel.app"   # your actual Vercel URL
ALERT_SECRET = "obx-pogue-life-2025"            # must match ALERT_SECRET in Vercel
```

Install dependencies:
```bash
pip install requests beautifulsoup4 playwright
playwright install chromium
```

Test it locally:
```bash
python tracker.py
```

---

## Step 6 — Run the tracker 24/7 on Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
2. Select your repo
3. Set the **Start Command** to:
   ```
   pip install requests beautifulsoup4 playwright && playwright install chromium && python tracker.py
   ```
4. Under **Variables**, add:
   ```
   SITE_URL=https://your-project.vercel.app
   ALERT_SECRET=obx-pogue-life-2025
   ```
5. Deploy — Railway will keep it running continuously

---

## How it all fits together

```
tracker.py (Railway, every 5 min)
    │
    ├── scrapes GoFobo + Tudum
    │
    ├── nothing found → POST /api/ping  (updates "last checked" on site)
    │
    └── tickets found → POST /api/alert
                            │
                            ├── flips status in Supabase (site shows LIVE)
                            ├── emails all subscribers via Resend
                            └── texts all subscribers via Twilio
```

---

## Customizing

- **Poll faster:** Change `POLL_INTERVAL_SECONDS = 300` in `tracker.py` (min ~60s to be polite)
- **Add more URLs to watch:** Edit `check_direct_gofobo_urls()` in `tracker.py`
- **Custom domain:** Buy a domain (e.g. `obxtickets.com`) and connect it in Vercel → Domains
- **Reset to not-live:** In Supabase SQL Editor: `update status set tickets_live = false where id = 1;`
