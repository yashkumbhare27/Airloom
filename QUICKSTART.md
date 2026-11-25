# Airloom – Start scripts

## Quick start (development)

### 1. Frontend dev server
```
cd airloom
npm run dev
```
Opens at http://localhost:5173

### 2. Backend proxy (in a second terminal)
```
cd airloom/proxy
# Add your Gemini API key to proxy/.env first:
#   GEMINI_API_KEY=your_key_here
npm start
```
Runs at http://localhost:3001

The Vite dev server proxies `/api/*` → `http://localhost:3001` automatically.

## Production build
```
cd airloom
npm run build
# Serve dist/ with any static file server + run proxy on the same domain
```

## Environment variables
Copy `.env.example` → `.env` and fill in:
- `VITE_PROXY_URL=/api` (default, works with Vite proxy in dev)
- `VITE_MAPS_KEY=` (optional – Google Maps satellite view)
- In `proxy/.env`: `GEMINI_API_KEY=your_key`

## What works without API keys
- Full air quality and weather data (Open-Meteo is free, no key needed)
- Aero voice assistant with deterministic intents
- All screens: Now, Twin, Lens, Swarm, Earth (offline hex), Me & Privacy
- Offline mode with cached snapshots
- PWA install on mobile

## What needs a key
- `GEMINI_API_KEY` in proxy/.env → Aero cloud AI fallback (richer answers)
- `VITE_MAPS_KEY` → Google Maps satellite view in Earth screen
