// core/types.ts
import { z } from 'zod';

export const AirSnapshotSchema = z.object({
  timestamp: z.string(),
  locationCoarse: z.object({ lat: z.number(), lng: z.number(), label: z.string() }),
  usAqi: z.number(),
  pm25: z.number(),
  pm10: z.number(),
  no2: z.number(),
  o3: z.number(),
  co: z.number(),
  so2: z.number(),
  category: z.enum(['Fresh', 'Fair', 'Hazy', 'Smog', 'Severe']),
  boundaryLayerHeight: z.number().optional(),
  inversionLikely: z.boolean().optional(),
  forecast48h: z.array(z.object({ hour: z.string(), aqi: z.number(), pm25: z.number() })).optional(),
  sources: z.array(z.string()).optional(),
});
export type AirSnapshot = z.infer<typeof AirSnapshotSchema>;

export const WeatherSnapshotSchema = z.object({
  timestamp: z.string(),
  locationCoarse: z.object({ lat: z.number(), lng: z.number(), label: z.string() }),
  tempC: z.number(),
  feelsLikeC: z.number(),
  weatherCode: z.number(),
  conditionKey: z.string(),
  humidity: z.number(),
  windKmh: z.number(),
  precipProbPct: z.number(),
  uvIndex: z.number(),
  sunrise: z.string(),
  sunset: z.string(),
  hourly24: z.array(z.object({ hour: z.string(), tempC: z.number(), precipProbPct: z.number() })).optional(),
  daily3: z.array(z.object({ date: z.string(), maxC: z.number(), minC: z.number(), conditionKey: z.string(), precipProbPct: z.number() })).optional(),
});
export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;

export const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  riskFlags: z.array(z.enum(['child', 'elderly', 'respiratory', 'outdoor_exerciser'])),
  activityHabits: z.string().optional(),
  commuteMode: z.enum(['walk', 'cycle', 'metro', 'bus', 'car_ac', 'car_windows_open']).optional(),
  schedule: z.string().optional(),
});
export type Member = z.infer<typeof MemberSchema>;

export const LifestyleSchema = z.object({
  homeType: z.enum(['apartment', 'house', 'flat']).optional(),
  floor: z.number().optional(),
  roomVolumes: z.number().optional(),
  cookingFuel: z.enum(['gas', 'induction', 'wood', 'other']).optional(),
  purifier: z.object({ cadr: z.number(), rooms: z.number() }).optional(),
  vehicle: z.string().optional(),
  budgetBand: z.enum(['free', 'low', 'medium', 'high']).optional(),
  windowHabits: z.enum(['open_all', 'open_am', 'closed']).optional(),
});
export type Lifestyle = z.infer<typeof LifestyleSchema>;

export const PlanBlockSchema = z.object({
  id: z.string(),
  start: z.string(),
  end: z.string(),
  label: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  exposureEstimate: z.number(),
  lowerExposureOption: z.string().optional(),
  lowerEmissionOption: z.string().optional(),
  impactRefs: z.array(z.string()).optional(),
});
export type PlanBlock = z.infer<typeof PlanBlockSchema>;

export const ImpactResultSchema = z.object({
  id: z.string(),
  kind: z.enum(['exposure', 'cigarette_eq', 'co2', 'indoor']),
  valueLow: z.number(),
  valueMid: z.number(),
  valueHigh: z.number(),
  unit: z.string(),
  inputs: z.record(z.string(), z.unknown()),
  formulaId: z.string(),
  assumptions: z.array(z.string()),
  sourceIds: z.array(z.string()),
});
export type ImpactResult = z.infer<typeof ImpactResultSchema>;

export const ActionSchema = z.object({
  id: z.string(),
  type: z.enum(['schoolNote', 'societyNotice', 'pledge', 'reminder']),
  draft: z.string(),
  status: z.enum(['pending', 'approved', 'discarded']),
  createdAt: z.string(),
});
export type Action = z.infer<typeof ActionSchema>;

export const VoiceSettingsSchema = z.object({
  wakeEnabled: z.boolean(),
  wakePhrase: z.string().default('hey aero'),
  speakReplies: z.boolean(),
  voiceLang: z.enum(['en-IN', 'hi-IN', 'mr-IN']),
  rate: z.number().min(0.5).max(2),
  pitch: z.number().min(0.5).max(2),
  localRecognitionPreferred: z.boolean(),
});
export type VoiceSettings = z.infer<typeof VoiceSettingsSchema>;

export const NotificationPrefsSchema = z.object({
  dailyEnabled: z.boolean(),
  dailyTime: z.string().default('07:30'),
  timezone: z.string(),
  severeAlertEnabled: z.boolean(),
  severeThreshold: z.number().default(300),
  rainAlertEnabled: z.boolean(),
  quietHours: z.object({ start: z.string(), end: z.string() }).optional(),
  speakOnOpen: z.boolean(),
  pushSubscription: z.string().optional(),
});
export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>;

export const OutboundLogEntrySchema = z.object({
  time: z.string(),
  purpose: z.string(),
  destination: z.string(),
  fieldsSent: z.array(z.string()),
  bytesSent: z.number(),
  onDevice: z.boolean(),
});
export type OutboundLogEntry = z.infer<typeof OutboundLogEntrySchema>;

export type AqiCategory = 'Fresh' | 'Fair' | 'Hazy' | 'Smog' | 'Severe';
export type Theme = 'fresh' | 'fair' | 'hazy' | 'smog' | 'severe';

export function aqiToCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return 'Fresh';
  if (aqi <= 100) return 'Fair';
  if (aqi <= 150) return 'Hazy';
  if (aqi <= 300) return 'Smog';
  return 'Severe';
}

export function categoryToTheme(cat: AqiCategory): Theme {
  return cat.toLowerCase() as Theme;
}
