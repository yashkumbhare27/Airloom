// TwinScreen.tsx – Exposure Digital Twin
import { useState } from 'react';
import { useApp } from '../../AppContext';
import { commuteExposure, co2Delta } from '../../core/impact';
import { COMMUTE_FACTOR, CO2_FACTOR } from '../../core/constants';

type CommuteModeKey = keyof typeof COMMUTE_FACTOR;

export function TwinScreen() {
  const { air } = useApp();
  const [mode, setMode] = useState<CommuteModeKey>('car_ac');
  const [duration, setDuration] = useState(30);
  const [windowsOpen, setWindowsOpen] = useState(2);

  const baseline = air ? commuteExposure({ pm25: air.pm25, mode: 'car_ac', durationMin: duration }) : null;
  const scenario = air ? commuteExposure({ pm25: air.pm25, mode, durationMin: duration }) : null;
  const co2 = co2Delta({ fromMode: 'car_ac', toMode: mode, distanceKm: (duration / 60) * 20 });

  const pctChange = baseline && scenario
    ? Math.round(((scenario.valueMid - baseline.valueMid) / baseline.valueMid) * 100)
    : 0;

  const modes: { key: CommuteModeKey; label: string; icon: string }[] = [
    { key: 'walk', label: 'Walk', icon: '🚶' },
    { key: 'cycle', label: 'Cycle', icon: '🚲' },
    { key: 'metro', label: 'Metro', icon: '🚇' },
    { key: 'bus', label: 'Bus', icon: '🚌' },
    { key: 'car_ac', label: 'Car (AC)', icon: '🚗' },
    { key: 'car_windows_open', label: 'Car (open)', icon: '🚗💨' },
  ];

  const normalise = (v: number, max: number) => Math.min(100, (v / max) * 100);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4 space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>📊 Exposure Digital Twin</h1>
      <p className="text-sm opacity-60">Compare your exposure under different commute scenarios. Relative Exposure Index (0–100 = worst).</p>

      {/* Mode selector */}
      <div className="card space-y-3">
        <div className="font-semibold text-sm">Transport mode</div>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button
              key={m.key}
              className={`chip text-sm transition ${mode === m.key ? 'text-white' : 'opacity-70 hover:opacity-100'}`}
              style={{ background: mode === m.key ? 'var(--color-primary)' : 'var(--color-surface-2)', color: mode === m.key ? 'white' : 'inherit' }}
              onClick={() => setMode(m.key)}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <label className="block text-sm">Commute duration: <strong>{duration} min</strong>
          <input type="range" min={5} max={120} value={duration} onChange={(e) => setDuration(+e.target.value)}
            className="w-full mt-1" aria-label="Commute duration in minutes" />
        </label>
      </div>

      {/* Comparison chart */}
      {baseline && scenario && (
        <div className="card space-y-4">
          <div className="font-semibold text-sm">Relative exposure index (0–100)</div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Baseline (Car AC)</span>
                <span>{baseline.valueMid.toFixed(1)} µg inhaled</span>
              </div>
              <div className="h-6 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
                <div className="h-full rounded-full bg-orange-500 transition-all"
                  style={{ width: `${normalise(baseline.valueMid, 500)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Scenario ({modes.find((m) => m.key === mode)?.label})</span>
                <span>{scenario.valueMid.toFixed(1)} µg inhaled</span>
              </div>
              <div className="h-6 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${normalise(scenario.valueMid, 500)}%`, background: pctChange < 0 ? '#0d9488' : pctChange > 0 ? '#e11d48' : '#d97706' }} />
              </div>
            </div>
          </div>

          {/* Headline chips */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className={`chip ${pctChange < 0 ? 'bg-teal-500 text-white' : pctChange > 0 ? 'bg-rose-500 text-white' : 'bg-gray-300'}`}>
              Exposure: {pctChange > 0 ? '+' : ''}{pctChange}%
            </span>
            <span className="chip" style={{ background: 'var(--color-surface-2)' }}>
              CO₂ saved: ~{co2.valueMid}g
              <button className="ml-1 opacity-60 text-xs underline" onClick={() => {}}>Why?</button>
            </span>
          </div>

          <p className="text-xs opacity-50">Range: {scenario.valueLow.toFixed(1)}–{scenario.valueHigh.toFixed(1)} µg (estimate)</p>

          <div className="flex gap-2">
            <button className="btn-ghost text-sm flex-1">Compare profiles</button>
            <button className="btn-primary text-sm flex-1">Save as my plan</button>
          </div>
        </div>
      )}

      {/* Text alternative for accessibility */}
      <div className="card text-sm" aria-live="polite">
        <div className="font-semibold mb-1">Summary (screen reader)</div>
        {baseline && scenario ? (
          <p>Using {modes.find((m) => m.key === mode)?.label} for {duration} minutes at current AQI {air?.usAqi},
            your estimated exposure is {scenario.valueMid.toFixed(1)} µg, compared to {baseline.valueMid.toFixed(1)} µg
            by car with AC — a {Math.abs(pctChange)}% {pctChange < 0 ? 'reduction' : 'increase'}.
            CO₂ change: {co2.valueMid > 0 ? `-${co2.valueMid}g` : `+${Math.abs(co2.valueMid)}g`}.</p>
        ) : <p>Load air data to see comparison.</p>}
      </div>
    </div>
  );
}
