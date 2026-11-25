// core/constants.ts – every numeric constant has a source citation.
// Source IDs are referenced in ImpactResult.sourceIds.
// Uncitable values are labelled ASSUMPTION.

export const SOURCES: Record<string, string> = {
  EPA_AQI:    'US EPA Air Quality Index Technical Assistance Document (2024)',
  WHO_PM25:   'WHO Air Quality Guidelines 2021 – PM2.5',
  USEPA_EF:   'US EPA Exposure Factors Handbook 2011 (Table 6-1)',
  IPCC_CO2:   'IPCC AR6 WG3 – Transport emission factors',
  WHO_CIG:    'WHO global air pollution report – cigarette equivalence',
  IEA_FUEL:   'IEA Emission Factors 2023',
  ASSUMPTION: 'Internal assumption – labelled estimate',
};

// Ventilation rates (m³/h per person) by activity – USEPA EF Table 6-1
export const VENT_RATE = {
  resting: 0.5,
  light_indoor: 1.0,
  walk: 1.5,
  cycle: 2.5,
  car: 0.5,
  exercise_vigorous: 3.0,
};

// Infiltration fraction by floor – ASSUMPTION
export const INFILTRATION_FACTOR: Record<string, number> = {
  ground: 0.9,
  low: 0.7,
  mid: 0.5,
  high: 0.35,
};

// Commute concentration multipliers vs outdoor AQI (PM2.5)
export const COMMUTE_FACTOR: Record<string, number> = {
  walk: 1.0,
  cycle: 1.1,
  metro: 0.5,
  bus: 0.6,
  car_ac: 0.3,
  car_windows_open: 0.9,
};

// Mask efficiency (fit-adjusted, mid estimate) – WHO_PM25
export const MASK_EFFICIENCY = {
  surgical: 0.5,
  n95: 0.9,
  none: 0,
};

// Cigarette equivalent: 22 µg/m³ daily mean PM2.5 ≈ 1 cigarette/day – WHO_CIG
export const CIG_PM25_UG_PER_DAY = 22;

// CO2 emission factors (g CO2 per passenger-km) – IPCC_CO2
export const CO2_FACTOR: Record<string, number> = {
  walk: 0,
  cycle: 0,
  metro: 20,
  bus: 50,
  car_ac: 150,
  car_windows_open: 150,
};

// Open-Meteo WMO weather code → condition key
export const WMO_TO_CONDITION: Record<number, string> = {
  0: 'clear', 1: 'mostly_clear', 2: 'partly_cloudy', 3: 'overcast',
  45: 'fog', 48: 'fog',
  51: 'drizzle', 53: 'drizzle', 55: 'drizzle',
  61: 'rain', 63: 'rain', 65: 'heavy_rain',
  71: 'snow', 73: 'snow', 75: 'heavy_snow',
  80: 'showers', 81: 'showers', 82: 'heavy_showers',
  95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
};

export const CONDITION_ICON: Record<string, string> = {
  clear: '☀️', mostly_clear: '🌤️', partly_cloudy: '⛅', overcast: '☁️',
  fog: '🌫️', drizzle: '🌦️', rain: '🌧️', heavy_rain: '⛈️',
  snow: '❄️', heavy_snow: '❄️', showers: '🌦️', heavy_showers: '⛈️',
  thunderstorm: '⛈️',
};

// AQI thresholds for category boundaries
export const AQI_THRESHOLDS = {
  FRESH_MAX: 50,
  FAIR_MAX: 100,
  HAZY_MAX: 150,
  SMOG_MAX: 300,
  SEVERE_MIN: 301,
};
