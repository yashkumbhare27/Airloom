# 🌿 Airloom

**Privacy-first, GenAI-powered urban air quality and weather assistant**  
Built for PromptWars Challenge 6 · A fully working web app, not a demo.

---

## What it does

Airloom helps families navigate severe winter smog and urban air pollution. It:

- 📍 **Shows live AQI & weather** for your real location (Open-Meteo, free API, no key needed)
- 🤖 **Aero voice assistant** — say "Hey Aero, what's the weather today?" and get a spoken reply
- 👨‍👩‍👧 **Personalised per family member** — kids, elderly, respiratory risk, outdoor athletes
- 🔒 **Privacy-first** — your name, age, health data, photos, and voice transcripts never leave your device (IndexedDB only)
- 📊 **Exposure Digital Twin** — compare commute options with real impact numbers
- 📷 **Lens** — on-device camera analysis for sky/room/source
- 🗺️ **Swarm** — anonymous community reporting with hex map
- 🌍 **Earth** — satellite/offline map with AQI overlay
- 🔔 **Daily notifications** — morning briefing via Web Push, personalised locally
- 📱 **PWA** — installable, works offline with cached snapshots
- 🌐 **3 languages** — English, Hindi, Marathi

---

## Quick Start

```powershell
# 1. Frontend (PowerShell from airloom/)
cd airloom
npm install
npm run dev        # → http://localhost:5173

# 2. Backend proxy (new terminal, from proxy/)
cd airloom/proxy
# Edit proxy/.env → add GEMINI_API_KEY=your_key (optional for richer AI)
npm start          # → http://localhost:3001
```

**Or use `.\start.ps1`** (Windows) to open both in separate windows automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + CSS custom properties (5 mood themes) |
| Storage | Dexie (IndexedDB) — all sensitive data on-device |
| AI router | Chrome built-in AI (Gemini Nano) → Cloud proxy → Offline template |
| Air data | Open-Meteo Air Quality API (free, no key) |
| Weather | Open-Meteo Forecast API (free, no key) |
| Maps | Google Maps JS API (optional satellite view) |
| PWA | Vite PWA + Workbox |
| Backend | Express.js proxy (thin, stateless, no user data stored) |

---

## Architecture

```
Browser (IndexedDB – all private data)
  ├── core/air.ts         → fetch air + weather via proxy
  ├── core/impact.ts      → pure deterministic exposure math (cited sources)
  ├── core/router.ts      → on-device AI → cloud → offline fallback
  ├── core/voice.ts       → Aero wake phrase + intents + speech
  ├── core/db.ts          → Dexie schema (household, plans, chat, logs)
  └── core/privacy.ts     → PII guard + outbound log

Proxy (Node/Express – stateless, server-side key)
  ├── GET /api/air        → Open-Meteo Air Quality API
  ├── GET /api/weather    → Open-Meteo Forecast API
  └── POST /api/ai        → Gemini API (key never in browser bundle)
```

---

## Privacy

- Your **household profile, health flags, photos, voice transcripts, and chat history** are stored only in your browser's IndexedDB
- Only **coarsened location** (~2km accuracy) and **anonymous air readings** are sent to fetch data
- The **"What left your device" log** in Me & Privacy shows every outbound call
- **0 personal fields** are ever sent to external services

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_PROXY_URL` | `.env` | Backend proxy URL (default: `/api`) |
| `VITE_MAPS_KEY` | `.env` | Google Maps key (optional, referrer-restricted) |
| `GEMINI_API_KEY` | `proxy/.env` | Gemini API key (server-side, never in browser bundle) |

---

## Disclaimer

Airloom provides informational air quality and weather guidance and exposure estimates. It is not medical advice and never provides diagnoses or medication guidance.

Air data: Open-Meteo Air Quality API · Weather: Open-Meteo Forecast API
