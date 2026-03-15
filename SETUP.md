# Ahsan's Trading Platform — Setup Guide

## Prerequisites

- Python 3.9+ (for the API)
- Node.js 18+ (for the frontend)
- The `scalper-lvn` Python repo (API server lives there)

---

## 1. Start the Python API

The FastAPI backend lives inside `scalper-lvn/`. It wraps the existing simulation engine.

```bash
cd ~/Documents/github/scalper-lvn

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the API server
uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
```

Verify it's running:
```bash
curl http://localhost:8000/health
# → {"status": "ok", "cache": {...}}
```

---

## 2. Start the Frontend

```bash
cd ~/Documents/github/ahsan-trading-platform

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 3. Configure the API URL

The frontend reads `NEXT_PUBLIC_API_URL` from `.env.local`.

```bash
# .env.local (already created, edit if needed)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

You can also change the URL at runtime in the **Settings** tab inside the app — hit "Test Connection" to verify it works.

---

## Screens

| Tab | What it does |
|-----|-------------|
| **Home** | Equity curve, 6 metric cards, recent trades. Empty until you run a backtest. |
| **Backtest** | Parameter sliders (SL, TP, breakeven R, entry zone, risk), date range picker with 1M/3M/6M/1Y/ALL quick ranges, run button → results inline |
| **Trades** | Full trade log filtered by Winners / Losers / Long / Short. Tap a trade to expand entry, exit, SL, TP, and contract size. |
| **Analytics** | 4 sub-tabs: Overview (full stats), Distribution (P&L and R histograms, exit reasons), Time (P&L by hour/day/month), Risk (rolling WR, cumulative R, streaks, daily P&L) |
| **Live** | WebSocket feed — shows open position, equity, pending signals, today's trades. Phase 2 stub is connected and ready. |
| **Settings** | Set API URL, test connection, PWA install instructions |

---

## Install on Your Phone (PWA)

No App Store needed — install directly from the browser.

**iOS (Safari):**
1. Open the app URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

**Android (Chrome):**
1. Open the app URL in Chrome
2. Tap **⋮** (three dots) → **Add to Home Screen**
3. Tap **Add**

The app will appear on your home screen and launch full-screen like a native app.

---

## Deploy (Optional)

### Frontend → Vercel (free)

```bash
cd ~/Documents/github/ahsan-trading-platform

# Initialise git if not already done
git init
git add .
git commit -m "initial"

# Push to GitHub, then import at vercel.com
# Set environment variable in Vercel dashboard:
#   NEXT_PUBLIC_API_URL = http://your-mac-lan-ip:8000
#   (or your Render.com URL once the API is deployed there)
```

### API → Local Mac (recommended for Phase 1)

Keep the API running on your Mac while you're working. Access it from your phone via your Mac's LAN IP:

```bash
# Find your Mac's LAN IP
ipconfig getifaddr en0   # Wi-Fi
# → e.g. 192.168.1.42

# Set in Vercel env vars:
# NEXT_PUBLIC_API_URL=http://192.168.1.42:8000
# (phone and Mac must be on the same Wi-Fi)
```

### API → Render.com (free, remote access)

1. Push `scalper-lvn/` to GitHub
2. Create a new Web Service on [render.com](https://render.com)
3. Set:
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn api.server:app --host 0.0.0.0 --port $PORT`
   - **Environment variable**: `LOG_LEVEL=INFO`
4. Copy the Render URL → set as `NEXT_PUBLIC_API_URL` in Vercel

> Note: Render free tier spins down after 15 min idle (~2s cold start on first request).

---

## Production Build

```bash
cd ~/Documents/github/ahsan-trading-platform
npm run build    # type-check + optimise
npm start        # serve production build on port 3000
```
