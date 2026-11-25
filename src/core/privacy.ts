// core/privacy.ts – privacy guard: strip PII before any outbound call
import { logOutbound } from './db';

/** Allowlisted fields safe to send externally */
const ALLOWED_FIELDS = new Set([
  'lat_coarse', 'lng_coarse', 'aqi', 'pm25', 'category', 'timestamp_hour',
  'language', 'explanation_mode', 'task_type', 'result_ids',
]);

/** Strip any field not in the allowlist */
export function sanitisePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (ALLOWED_FIELDS.has(k)) out[k] = v;
  }
  return out;
}

/** Privacy router: determines whether to use on-device AI or cloud proxy */
export function routeTask(taskType: string, touchesPrivate: boolean): 'on-device' | 'cloud' | 'offline' {
  if (touchesPrivate) return 'on-device';
  if (taskType === 'heavy') return 'cloud';
  return 'on-device';
}

/** Log outbound call with stripped fields */
export async function guardedFetch(
  url: string,
  payload: Record<string, unknown>,
  purpose: string,
): Promise<Response> {
  const safe = sanitisePayload(payload);
  const body = JSON.stringify(safe);
  await logOutbound({
    time: new Date().toISOString(),
    purpose,
    destination: new URL(url, location.href).hostname,
    fieldsSent: Object.keys(safe),
    bytesSent: body.length,
    onDevice: false,
  });
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
}
