// SwarmScreen.tsx – community reporting with H3 hex map
import { useState, useEffect } from 'react';
import { useApp } from '../../AppContext';

type ReportType = 'haze' | 'smoke' | 'biomass' | 'dust' | 'odour';

interface HexReport {
  h3: string;
  type: ReportType;
  count: number;
  label: string;
}

// Simulated aggregate data (from server counters only – no user IDs)
const MOCK_REPORTS: HexReport[] = [
  { h3: '8928308280fffff', type: 'haze', count: 12, label: 'Area A – Haze' },
  { h3: '8928308280bffff', type: 'smoke', count: 4, label: 'Area B – Smoke' },
  { h3: '89283082807ffff', type: 'biomass', count: 7, label: 'Area C – Biomass burning' },
];

export function SwarmScreen() {
  const { air, location } = useApp();
  const [reports, setReports] = useState<HexReport[]>(MOCK_REPORTS);
  const [selectedType, setSelectedType] = useState<ReportType>('haze');
  const [reporting, setReporting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const typeColors: Record<ReportType, string> = {
    haze: '#d97706', smoke: '#6b7280', biomass: '#dc2626', dust: '#a16207', odour: '#7c3aed',
  };

  async function submitReport() {
    setReporting(true);
    // No GPS stored; snap to coarse H3 cell
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setReporting(false);
    // After 3 reports from different devices with consensus rule, it appears on map
  }

  const totalReports = reports.reduce((s, r) => s + r.count, 0);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4 space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>🗺️ Swarm</h1>
      <div className="chip text-xs font-medium" style={{ background: 'var(--color-surface-2)' }}>
        📊 Crowd-sourced indicators, not measured AQI
      </div>

      {/* Hex map (SVG representation) */}
      <div className="card">
        <div className="font-semibold text-sm mb-3">Community air reports — your area</div>
        <div className="relative min-h-48 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)' }}>
          {/* SVG hex grid */}
          <svg viewBox="0 0 400 300" className="w-full h-full" aria-label="Hex map of community air reports">
            {/* Grid hexagons */}
            {[
              { cx: 100, cy: 100, type: 'haze' as ReportType, count: 12 },
              { cx: 200, cy: 80, type: 'smoke' as ReportType, count: 4 },
              { cx: 300, cy: 110, type: 'biomass' as ReportType, count: 7 },
              { cx: 150, cy: 160, type: 'dust' as ReportType, count: 2 },
              { cx: 250, cy: 170, type: 'haze' as ReportType, count: 5 },
            ].map((hex, i) => {
              const r = 35;
              const pts = Array.from({ length: 6 }, (_, k) => {
                const angle = (Math.PI / 3) * k;
                return `${hex.cx + r * Math.cos(angle)},${hex.cy + r * Math.sin(angle)}`;
              }).join(' ');
              return (
                <g key={i}>
                  <polygon
                    points={pts}
                    fill={`${typeColors[hex.type]}cc`}
                    stroke="white"
                    strokeWidth="1"
                    opacity={0.7 + (hex.count / 20)}
                  />
                  <text x={hex.cx} y={hex.cy + 4} textAnchor="middle" fill="white" fontSize="10">
                    {hex.type}
                  </text>
                  <text x={hex.cx} y={hex.cy + 16} textAnchor="middle" fill="white" fontSize="8" opacity={0.7}>
                    {hex.count} reports
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="absolute bottom-2 right-2 text-xs text-white/60">Coarse grid · no GPS stored</div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(Object.entries(typeColors) as [ReportType, string][]).map(([t, c]) => (
            <span key={t} className="chip text-xs" style={{ background: c + '33', color: c }}>● {t}</span>
          ))}
        </div>
      </div>

      {/* Report haze */}
      <div className="card space-y-3">
        <div className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Report what you see</div>
        <p className="text-xs opacity-60">Anonymous. No GPS coordinate stored. Minimum 3 independent reports needed before it appears on map.</p>
        <div className="flex flex-wrap gap-2">
          {(['haze', 'smoke', 'biomass', 'dust', 'odour'] as ReportType[]).map((t) => (
            <button key={t}
              className={`chip text-sm capitalize ${selectedType === t ? 'text-white' : 'opacity-70'}`}
              style={{ background: selectedType === t ? typeColors[t] : 'var(--color-surface-2)', color: selectedType === t ? 'white' : 'inherit' }}
              onClick={() => setSelectedType(t)}>
              {t}
            </button>
          ))}
        </div>
        {submitted ? (
          <div className="chip text-sm bg-green-500 text-white">✅ Reported anonymously. Thank you!</div>
        ) : (
          <button className="btn-primary w-full" onClick={submitReport} disabled={reporting}>
            {reporting ? 'Submitting…' : `📢 Report ${selectedType}`}
          </button>
        )}
        <p className="text-xs opacity-40">Your device snaps to a coarse hex cell. No GPS pin or user ID is stored.</p>
      </div>

      {/* Collective impact */}
      <div className="card space-y-3">
        <div className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Collective impact</div>
        {totalReports === 0 ? (
          <p className="text-sm opacity-50">No reports yet in your area. Be the first to contribute.</p>
        ) : (
          <>
            <div className="text-3xl font-black">{totalReports}</div>
            <div className="text-sm opacity-60">total community reports in the last 2 hours</div>
            {reports.map((r) => (
              <div key={r.h3} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ background: typeColors[r.type] }} />
                {r.label} · {r.count} reports
              </div>
            ))}
          </>
        )}
      </div>

      {/* Action drafts */}
      <div className="card space-y-3">
        <div className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Community actions</div>
        <div className="space-y-2">
          <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--color-surface)' }}>
            <div className="font-medium">🏫 Draft school note</div>
            <p className="text-xs opacity-60 mt-1">Alert parents about outdoor activities based on current AQI {air?.usAqi ?? '?'}.</p>
            <div className="flex gap-2 mt-2">
              <button className="btn-primary text-xs px-3 py-1">Approve & Copy</button>
              <button className="btn-ghost text-xs px-3 py-1">Discard</button>
            </div>
          </div>
          <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--color-surface)' }}>
            <div className="font-medium">🏢 Draft society notice</div>
            <p className="text-xs opacity-60 mt-1">Advise residents to limit outdoor exposure today.</p>
            <div className="flex gap-2 mt-2">
              <button className="btn-primary text-xs px-3 py-1">Approve & Copy</button>
              <button className="btn-ghost text-xs px-3 py-1">Discard</button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs opacity-40 text-center">Swarm data is crowd-sourced community indicators, not measured AQI. Reports expire after 2 hours.</p>
    </div>
  );
}
