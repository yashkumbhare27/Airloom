// proxy/server.js – thin stateless proxy for Open-Meteo (air + weather) + Gemini API
// No user IDs, no raw coordinates, no profile data stored.
// Run: node proxy/server.js (or deploy to Cloud Run / Firebase Functions)

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));
app.use(express.json({ limit: '50kb' }));

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CLOUD_MODEL = process.env.CLOUD_MODEL ?? 'gemini-2.0-flash';

// ── Air Quality ──────────────────────────────────────────────
app.get('/api/air', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required' });

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm2_5,pm10,nitrogen_dioxide,ozone,carbon_monoxide,sulphur_dioxide,us_aqi&current=pm2_5,pm10,nitrogen_dioxide,ozone,carbon_monoxide,sulphur_dioxide,us_aqi&timezone=auto`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'upstream error', detail: String(e) });
  }
});

// ── Weather ──────────────────────────────────────────────────
app.get('/api/weather', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required' });

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code,uv_index&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=3`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'upstream error', detail: String(e) });
  }
});

// ── Gemini AI proxy ──────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  if (!GEMINI_KEY) return res.status(503).json({ error: 'AI backend not configured' });

  const { task, systemPrompt, userPrompt, resultIds } = req.body;

  // Block: never forward if body accidentally contains PII patterns
  const bodyStr = JSON.stringify(req.body);
  if (/\b(name|age|riskFlag|transcript|photo|base64)\b/i.test(bodyStr)) {
    return res.status(400).json({ error: 'PII detected in request' });
  }

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generation_config: { max_output_tokens: 300, temperature: 0.4 },
  };

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CLOUD_MODEL}:generateContent?key=${GEMINI_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    res.json({ text });
  } catch (e) {
    res.status(502).json({ error: 'AI upstream error', detail: String(e) });
  }
});

// ── Health ──────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Airloom proxy listening on port ${PORT}`));
