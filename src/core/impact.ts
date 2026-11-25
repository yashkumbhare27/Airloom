// core/impact.ts – pure deterministic exposure & emission functions
// Every result includes low/mid/high ranges and a source citation list.
import {
  VENT_RATE, INFILTRATION_FACTOR, COMMUTE_FACTOR,
  CIG_PM25_UG_PER_DAY, CO2_FACTOR, MASK_EFFICIENCY, SOURCES,
} from './constants';
import type { ImpactResult, Member, Lifestyle, AirSnapshot } from './types';

function uuid(): string {
  return Math.random().toString(36).slice(2);
}

export function commuteExposure(params: {
  pm25: number;
  mode: keyof typeof COMMUTE_FACTOR;
  durationMin: number;
  maskType?: keyof typeof MASK_EFFICIENCY;
}): ImpactResult {
  const { pm25, mode, durationMin, maskType = 'none' } = params;
  const conc = pm25 * COMMUTE_FACTOR[mode];
  const maskEff = MASK_EFFICIENCY[maskType];
  const ventRate = mode === 'walk' || mode === 'cycle' ? VENT_RATE.walk : VENT_RATE.car;
  const hourFrac = durationMin / 60;
  const inhaled = conc * (1 - maskEff) * ventRate * hourFrac; // µg
  return {
    id: uuid(),
    kind: 'exposure',
    valueLow: +(inhaled * 0.7).toFixed(1),
    valueMid: +inhaled.toFixed(1),
    valueHigh: +(inhaled * 1.4).toFixed(1),
    unit: 'µg inhaled',
    inputs: { pm25, mode, durationMin, maskType },
    formulaId: 'commute_inhaled_v1',
    assumptions: ['Commute concentration factors from USEPA EF Table 6-1'],
    sourceIds: ['USEPA_EF', 'WHO_PM25'],
  };
}

export function indoorConcentration(params: {
  outdoorPm25: number;
  floor: number;
  windowHabits: 'open_all' | 'open_am' | 'closed';
  purifierCadr: number;
  roomVolume: number;
}): ImpactResult {
  const { outdoorPm25, floor, windowHabits, purifierCadr, roomVolume } = params;
  const floorKey = floor <= 0 ? 'ground' : floor <= 3 ? 'low' : floor <= 7 ? 'mid' : 'high';
  const infil = INFILTRATION_FACTOR[floorKey];
  const windowFactor = windowHabits === 'open_all' ? 1 : windowHabits === 'open_am' ? 0.6 : 0.3;
  const baseIndoor = outdoorPm25 * infil * windowFactor;
  const purifierAch = purifierCadr / roomVolume; // air changes/hour from purifier
  const removalFrac = purifierAch / (purifierAch + 1); // simplified mass balance
  const finalConc = baseIndoor * (1 - removalFrac * 0.8);
  return {
    id: uuid(),
    kind: 'indoor',
    valueLow: +(finalConc * 0.75).toFixed(1),
    valueMid: +finalConc.toFixed(1),
    valueHigh: +(finalConc * 1.3).toFixed(1),
    unit: 'µg/m³',
    inputs: params,
    formulaId: 'indoor_steady_state_v1',
    assumptions: ['Steady-state mass balance; purifier efficiency 80%'],
    sourceIds: ['WHO_PM25', 'ASSUMPTION'],
  };
}

export function cigaretteEquivalent(params: {
  dailyMeanPm25: number;
  exposureHours: number;
}): ImpactResult {
  const { dailyMeanPm25, exposureHours } = params;
  const dailyFrac = exposureHours / 24;
  const cigEq = (dailyMeanPm25 * dailyFrac) / CIG_PM25_UG_PER_DAY;
  return {
    id: uuid(),
    kind: 'cigarette_eq',
    valueLow: +(cigEq * 0.7).toFixed(2),
    valueMid: +cigEq.toFixed(2),
    valueHigh: +(cigEq * 1.4).toFixed(2),
    unit: 'cigarette-equivalents/day',
    inputs: params,
    formulaId: 'cig_eq_v1',
    assumptions: ['22 µg/m³ daily mean PM2.5 ≈ 1 cigarette/day (WHO)'],
    sourceIds: ['WHO_CIG'],
  };
}

export function co2Delta(params: {
  fromMode: keyof typeof CO2_FACTOR;
  toMode: keyof typeof CO2_FACTOR;
  distanceKm: number;
}): ImpactResult {
  const { fromMode, toMode, distanceKm } = params;
  const delta = (CO2_FACTOR[fromMode] - CO2_FACTOR[toMode]) * distanceKm;
  return {
    id: uuid(),
    kind: 'co2',
    valueLow: +(delta * 0.8).toFixed(0),
    valueMid: +delta.toFixed(0),
    valueHigh: +(delta * 1.2).toFixed(0),
    unit: 'g CO₂ saved',
    inputs: params,
    formulaId: 'co2_delta_v1',
    assumptions: [],
    sourceIds: ['IPCC_CO2'],
  };
}

export function memberExposureScore(member: Member, snapshot: AirSnapshot, lifestyle: Lifestyle): number {
  const base = snapshot.pm25;
  let multiplier = 1;
  if (member.riskFlags.includes('child')) multiplier += 0.3;
  if (member.riskFlags.includes('elderly')) multiplier += 0.2;
  if (member.riskFlags.includes('respiratory')) multiplier += 0.4;
  if (member.riskFlags.includes('outdoor_exerciser')) multiplier += 0.2;
  return +(base * multiplier).toFixed(1);
}
