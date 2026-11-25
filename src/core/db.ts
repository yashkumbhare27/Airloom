// core/db.ts – Dexie IndexedDB schema
// All sensitive data stays on device; never sync to server.
import Dexie, { type Table } from 'dexie';
import type {
  AirSnapshot, WeatherSnapshot, Member, Lifestyle,
  PlanBlock, Action, VoiceSettings, NotificationPrefs, OutboundLogEntry,
} from './types';

export interface HouseholdDoc {
  id: string; // singleton: 'household'
  members: Member[];
  primaryMemberId: string;
  language: 'en' | 'hi' | 'mr';
  explanationMode: 'standard' | 'kid' | 'grandparent' | 'technical';
  textSize: 'normal' | 'large' | 'x-large';
  reducedMotion: boolean;
  highContrast: boolean;
  setupComplete: boolean;
}

export interface LifestyleDoc {
  id: string; // 'lifestyle'
  data: Lifestyle;
}

export interface LocationDoc {
  id: string; // 'location'
  lat: number;
  lng: number;
  label: string;
  coarsened: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'aero';
  content: string;
  timestamp: string;
  source: 'on-device' | 'cloud-anonymised' | 'offline-template';
  spoken: boolean;
}

export class AirloomDB extends Dexie {
  airSnapshots!: Table<AirSnapshot & { id: string }>;
  weatherSnapshots!: Table<WeatherSnapshot & { id: string }>;
  household!: Table<HouseholdDoc>;
  lifestyle!: Table<LifestyleDoc>;
  location!: Table<LocationDoc>;
  plans!: Table<PlanBlock>;
  actions!: Table<Action>;
  chatMessages!: Table<ChatMessage>;
  voiceSettings!: Table<VoiceSettings & { id: string }>;
  notificationPrefs!: Table<NotificationPrefs & { id: string }>;
  outboundLog!: Table<OutboundLogEntry & { id: string }>;

  constructor() {
    super('AirloomDB');
    this.version(1).stores({
      airSnapshots: 'id, timestamp',
      weatherSnapshots: 'id, timestamp',
      household: 'id',
      lifestyle: 'id',
      location: 'id',
      plans: 'id, start',
      actions: 'id, type, status',
      chatMessages: 'id, timestamp',
      voiceSettings: 'id',
      notificationPrefs: 'id',
      outboundLog: 'id, time',
    });
  }
}

export const db = new AirloomDB();

// ── Helpers ───────────────────────────────────────────────────
export async function getHousehold(): Promise<HouseholdDoc | undefined> {
  return db.household.get('household');
}

export async function saveHousehold(h: Partial<HouseholdDoc>) {
  const existing = await getHousehold();
  await db.household.put({ ...existing, id: 'household', ...h } as HouseholdDoc);
}

export async function getLocation(): Promise<LocationDoc | undefined> {
  return db.location.get('location');
}

export async function saveLocation(loc: Omit<LocationDoc, 'id'>) {
  await db.location.put({ id: 'location', ...loc });
}

export async function getLatestAirSnapshot(): Promise<AirSnapshot | undefined> {
  return db.airSnapshots.orderBy('timestamp').last();
}

export async function saveAirSnapshot(snap: AirSnapshot) {
  const id = `air-${snap.timestamp}`;
  await db.airSnapshots.put({ ...snap, id });
  // Keep only last 50 entries
  const count = await db.airSnapshots.count();
  if (count > 50) {
    const oldest = await db.airSnapshots.orderBy('timestamp').first();
    if (oldest) await db.airSnapshots.delete(oldest.id);
  }
}

export async function getLatestWeatherSnapshot(): Promise<WeatherSnapshot | undefined> {
  return db.weatherSnapshots.orderBy('timestamp').last();
}

export async function saveWeatherSnapshot(snap: WeatherSnapshot) {
  const id = `wx-${snap.timestamp}`;
  await db.weatherSnapshots.put({ ...snap, id });
  const count = await db.weatherSnapshots.count();
  if (count > 50) {
    const oldest = await db.weatherSnapshots.orderBy('timestamp').first();
    if (oldest) await db.weatherSnapshots.delete(oldest.id);
  }
}

export async function getVoiceSettings(): Promise<VoiceSettings> {
  const doc = await db.voiceSettings.get('voice');
  return doc ?? {
    id: 'voice',
    wakeEnabled: false,
    wakePhrase: 'hey aero',
    speakReplies: true,
    voiceLang: 'en-IN',
    rate: 1,
    pitch: 1,
    localRecognitionPreferred: true,
  } as VoiceSettings & { id: string };
}

export async function saveVoiceSettings(vs: VoiceSettings) {
  await db.voiceSettings.put({ ...vs, id: 'voice' });
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const doc = await db.notificationPrefs.get('notif');
  return doc ?? {
    id: 'notif',
    dailyEnabled: false,
    dailyTime: '07:30',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    severeAlertEnabled: true,
    severeThreshold: 300,
    rainAlertEnabled: false,
    speakOnOpen: false,
  } as NotificationPrefs & { id: string };
}

export async function saveNotificationPrefs(prefs: NotificationPrefs) {
  await db.notificationPrefs.put({ ...prefs, id: 'notif' });
}

export async function logOutbound(entry: Omit<OutboundLogEntry, never>) {
  const id = `out-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await db.outboundLog.put({ ...entry, id });
}

export async function getLifestyle(): Promise<Lifestyle> {
  const doc = await db.lifestyle.get('lifestyle');
  return doc?.data ?? {};
}

export async function saveLifestyle(data: Lifestyle) {
  await db.lifestyle.put({ id: 'lifestyle', data });
}
