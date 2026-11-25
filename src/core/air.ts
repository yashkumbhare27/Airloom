// core/air.ts – Air & Weather data fetching via proxy or Open-Meteo directly
import type { AirSnapshot, WeatherSnapshot } from './types';
import { aqiToCategory } from './types';
import { WMO_TO_CONDITION } from './constants';
import { saveAirSnapshot, saveWeatherSnapshot, logOutbound } from './db';

const PROXY_BASE = import.meta.env.VITE_PROXY_URL || '/api';

function coarsen(lat: number, lng: number): { lat: number; lng: number } {
  // Round to ~2km grid (≈0.018°)
  return { lat: Math.round(lat / 0.018) * 0.018, lng: Math.round(lng / 0.018) * 0.018 };
}

export async function fetchAirSnapshot(lat: number, lng: number, label: string): Promise<AirSnapshot> {
  const { lat: cLat, lng: cLng } = coarsen(lat, lng);
  const url = `${PROXY_BASE}/air?lat=${cLat}&lng=${cLng}`;

  await logOutbound({
    time: new Date().toISOString(),
    purpose: 'air_quality_fetch',
    destination: url,
    fieldsSent: ['lat_coarse', 'lng_coarse'],
    bytesSent: url.length,
    onDevice: false,
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Air API ${res.status}`);
  const data = await res.json();

  // Open-Meteo Air Quality API response mapping
  const current = data.current ?? data;
  const hourly = data.hourly ?? null;

  const pm25 = current.pm2_5 ?? current.pm25 ?? 0;
  const pm10 = current.pm10 ?? 0;
  const no2  = current.nitrogen_dioxide ?? current.no2 ?? 0;
  const o3   = current.ozone ?? current.o3 ?? 0;
  const co   = current.carbon_monoxide ?? current.co ?? 0;
  const so2  = current.sulphur_dioxide ?? current.so2 ?? 0;
  const usAqi = current.us_aqi ?? current.european_aqi ?? Math.round(pm25 * 4.5);

  const forecast48h = hourly
    ? (hourly.time as string[]).slice(0, 48).map((t: string, i: number) => ({
        hour: t,
        aqi: hourly.us_aqi?.[i] ?? Math.round((hourly.pm2_5?.[i] ?? 0) * 4.5),
        pm25: hourly.pm2_5?.[i] ?? 0,
      }))
    : undefined;

  const snap: AirSnapshot = {
    timestamp: new Date().toISOString(),
    locationCoarse: { lat: cLat, lng: cLng, label },
    usAqi,
    pm25,
    pm10,
    no2,
    o3,
    co,
    so2,
    category: aqiToCategory(usAqi),
    inversionLikely: false,
    forecast48h,
    sources: ['Open-Meteo Air Quality API'],
  };

  await saveAirSnapshot(snap);
  return snap;
}

export async function fetchWeatherSnapshot(lat: number, lng: number, label: string): Promise<WeatherSnapshot> {
  const { lat: cLat, lng: cLng } = coarsen(lat, lng);
  const url = `${PROXY_BASE}/weather?lat=${cLat}&lng=${cLng}`;

  await logOutbound({
    time: new Date().toISOString(),
    purpose: 'weather_fetch',
    destination: url,
    fieldsSent: ['lat_coarse', 'lng_coarse'],
    bytesSent: url.length,
    onDevice: false,
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API ${res.status}`);
  const data = await res.json();

  const cur = data.current ?? {};
  const hourly = data.hourly ?? null;
  const daily = data.daily ?? null;
  const weatherCode = cur.weather_code ?? 0;

  const snap: WeatherSnapshot = {
    timestamp: new Date().toISOString(),
    locationCoarse: { lat: cLat, lng: cLng, label },
    tempC: cur.temperature_2m ?? 25,
    feelsLikeC: cur.apparent_temperature ?? 25,
    weatherCode,
    conditionKey: WMO_TO_CONDITION[weatherCode] ?? 'clear',
    humidity: cur.relative_humidity_2m ?? 50,
    windKmh: cur.wind_speed_10m ?? 0,
    precipProbPct: cur.precipitation_probability ?? (hourly?.precipitation_probability?.[0] ?? 0),
    uvIndex: cur.uv_index ?? 0,
    sunrise: daily?.sunrise?.[0] ?? '',
    sunset: daily?.sunset?.[0] ?? '',
    hourly24: hourly?.time?.slice(0, 24).map((t: string, i: number) => ({
      hour: t,
      tempC: hourly.temperature_2m?.[i] ?? 0,
      precipProbPct: hourly.precipitation_probability?.[i] ?? 0,
    })),
    daily3: daily?.time?.slice(0, 3).map((d: string, i: number) => ({
      date: d,
      maxC: daily.temperature_2m_max?.[i] ?? 0,
      minC: daily.temperature_2m_min?.[i] ?? 0,
      conditionKey: WMO_TO_CONDITION[daily.weather_code?.[i] ?? 0] ?? 'clear',
      precipProbPct: daily.precipitation_probability_max?.[i] ?? 0,
    })),
  };

  await saveWeatherSnapshot(snap);
  return snap;
}

export async function geocodeCity(query: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results?.length) {
      const r = data.results[0];
      return { lat: r.latitude, lng: r.longitude, label: `${r.name}, ${r.country}` };
    }
  } catch {}
  return null;
}
