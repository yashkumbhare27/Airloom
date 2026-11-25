// NowScreen.tsx – the main dashboard screen
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { verdictForAqi, t } from '../../core/i18n';
import { cigaretteEquivalent, commuteExposure, indoorConcentration } from '../../core/impact';
import { CONDITION_ICON } from '../../core/constants';
import { routeAI } from '../../core/router';
import type { Lang } from '../../core/i18n';
import type { ImpactResult } from '../../core/types';

function WhyDrawer({ result }: { result: ImpactResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="text-xs underline opacity-60 hover:opacity-100" onClick={() => setOpen((p) => !p)}>
        Why? ▾
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg text-xs space-y-1" style={{ background: 'var(--color-surface-2)' }}>
          <div><strong>Formula:</strong> {result.formulaId}</div>
          <div><strong>Range:</strong> {result.valueLow}–{result.valueHigh} {result.unit}</div>
          <div><strong>Inputs:</strong> {Object.entries(result.inputs).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
          {result.assumptions.map((a, i) => <div key={i} className="italic opacity-70">{a}</div>)}
          <div><strong>Sources:</strong> {result.sourceIds.join(', ')}</div>
        </div>
      )}
    </div>
  );
}

export function NowScreen() {
  const { air, weather, household, activeMemberId, lang, category, setActiveMember, lifestyle } = useApp();
  const navigate = useNavigate();
  const lk = lang as Lang;
  const [nextAction, setNextAction] = useState<string>('');
  const [nextActionSource, setNextActionSource] = useState('');
  const [loadingNA, setLoadingNA] = useState(false);

  const verdict = air ? verdictForAqi(air.usAqi, lk) : 'Loading…';
  const activeMember = household?.members.find((m) => m.id === activeMemberId) ?? household?.members[0];

  // Compute impact numbers
  const cigResult = air ? cigaretteEquivalent({ dailyMeanPm25: air.pm25, exposureHours: 16 }) : null;
  const commuteResult = air && lifestyle.vehicle ? commuteExposure({
    pm25: air.pm25,
    mode: lifestyle.vehicle as 'walk' | 'cycle' | 'metro' | 'bus' | 'car_ac' | 'car_windows_open',
    durationMin: 30,
  }) : null;
  const indoorResult = air ? indoorConcentration({
    outdoorPm25: air.pm25,
    floor: lifestyle.floor ?? 2,
    windowHabits: lifestyle.windowHabits ?? 'open_am',
    purifierCadr: lifestyle.purifier?.cadr ?? 0,
    roomVolume: lifestyle.roomVolumes ?? 50,
  }) : null;

  // Load next best action from AI
  useEffect(() => {
    if (!air) return;
    setLoadingNA(true);
    routeAI({
      type: 'next_best_action',
      systemPrompt: `You are Airloom's recommendation engine. AQI: ${air.usAqi} (${air.category}), PM2.5: ${air.pm25}. ${activeMember ? `Member: ${activeMember.name}, age ${activeMember.age}, flags: ${activeMember.riskFlags.join(', ')}.` : ''} Give ONE specific, practical action in 1–2 sentences. No medication advice.`,
      userPrompt: 'What is the next best action for this household member right now?',
      resultIds: [],
    }).then((r) => {
      setNextAction(r.text);
      setNextActionSource(r.source);
      setLoadingNA(false);
    }).catch(() => {
      setNextAction(air.usAqi > 150 ? 'Stay indoors and run your air purifier.' : 'Conditions are manageable. Keep windows closed during peak hours.');
      setNextActionSource('offline-template');
      setLoadingNA(false);
    });
  }, [air?.usAqi, activeMemberId]);

  const pollutants = air ? [
    { label: 'PM2.5', value: air.pm25.toFixed(1), unit: 'µg/m³' },
    { label: 'PM10', value: air.pm10.toFixed(1), unit: 'µg/m³' },
    { label: 'NO₂', value: air.no2.toFixed(1), unit: 'µg/m³' },
    { label: 'O₃', value: air.o3.toFixed(1), unit: 'µg/m³' },
    { label: 'CO', value: air.co.toFixed(1), unit: 'µg/m³' },
    { label: 'SO₂', value: air.so2.toFixed(1), unit: 'µg/m³' },
  ] : [];

  const aqiColor: Record<string, string> = {
    Fresh: '#0d9488', Fair: '#65a30d', Hazy: '#d97706', Smog: '#c2410c', Severe: '#e11d48',
  };

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24 md:pb-4 space-y-4">
      {/* Member switcher */}
      {household && household.members.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {household.members.map((m) => (
            <button
              key={m.id}
              className={`chip text-sm transition ${m.id === (activeMemberId ?? household.members[0].id) ? 'text-white' : 'opacity-70 hover:opacity-100'}`}
              style={{
                background: m.id === (activeMemberId ?? household.members[0].id) ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: m.id === (activeMemberId ?? household.members[0].id) ? 'white' : 'inherit',
              }}
              onClick={() => setActiveMember(m.id)}
            >
              👤 {m.name}
              {m.riskFlags.map((f) => ({ child: '👦', elderly: '👴', respiratory: '🫁', outdoor_exerciser: '🏃' }[f] ?? '')).join('')}
            </button>
          ))}
        </div>
      )}

      {/* AQI Card */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm opacity-60 mb-1">{t('aqi', lk)} · Live</div>
            <div className="text-6xl font-black" style={{ color: aqiColor[category] ?? 'var(--color-primary)' }}>
              {air?.usAqi ?? '–'}
            </div>
            <div className="text-xl font-bold mt-1" style={{ color: aqiColor[category] }}>
              {air ? t(air.category.toLowerCase() as Parameters<typeof t>[0], lk) : '–'}
            </div>
            <p className="text-sm mt-2 opacity-80">{verdict}</p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs opacity-50">
              {air ? new Date(air.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
            {/* Severe mode emergency badge */}
            {category === 'Severe' && (
              <div className="chip text-xs text-white bg-rose-700">🚨 Emergency</div>
            )}
          </div>
        </div>

        {/* Pollutant chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {pollutants.map((p) => (
            <span key={p.label} className="chip text-xs" style={{ background: 'var(--color-surface)' }}>
              {p.label} <strong>{p.value}</strong> <span className="opacity-50">{p.unit}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Weather Card */}
      {weather && (
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl" aria-hidden>{CONDITION_ICON[weather.conditionKey] ?? '🌤️'}</span>
            <div>
              <div className="text-2xl font-bold">{Math.round(weather.tempC)}°C</div>
              <div className="text-sm opacity-60">Feels like {Math.round(weather.feelsLikeC)}°C · {weather.conditionKey.replace(/_/g, ' ')}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="chip" style={{ background: 'var(--color-surface)' }}>💧 {weather.humidity}% humidity</span>
            <span className="chip" style={{ background: 'var(--color-surface)' }}>💨 {Math.round(weather.windKmh)} km/h</span>
            <span className="chip" style={{ background: 'var(--color-surface)' }}>🌧️ {weather.precipProbPct}% rain</span>
            <span className="chip" style={{ background: 'var(--color-surface)' }}>☀️ UV {weather.uvIndex}</span>
          </div>
          <p className="text-xs opacity-50 mt-2">Why this matters for air: Temperature, humidity and wind affect particle concentrations.</p>
        </div>
      )}

      {/* Next Best Action */}
      <div className="card border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>
          {t('nextAction', lk)}
        </div>
        {loadingNA ? (
          <div className="text-sm animate-pulse opacity-50">Calculating…</div>
        ) : (
          <>
            <p className="text-sm">{nextAction}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs opacity-40">
                {nextActionSource === 'on-device' ? 'Ran locally on Gemini Nano'
                  : nextActionSource === 'cloud-anonymised' ? 'Cloud · anonymised'
                  : 'Offline template'}
              </span>
              <button className="text-xs underline opacity-60 hover:opacity-100" onClick={() => navigate('/app/twin')}>
                Simulate in Twin →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Severe mode emergency checklist */}
      {category === 'Severe' && (
        <div className="card border-2 border-rose-700">
          <div className="font-bold text-rose-400 mb-2">🚨 Severe Air — Emergency Checklist</div>
          <ul className="space-y-2">
            {['Seal window and door gaps with towels or tape', 'Set purifier to highest setting', 'Wear N95 for any outing — avoid all outdoor exercise', 'Move exercise indoors', 'Check on elderly neighbours'].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 shrink-0" id={`ec-${i}`} />
                <label htmlFor={`ec-${i}`}>{item}</label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Impact numbers */}
      <div className="card space-y-3">
        <div className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Exposure estimates (approximations)</div>
        {cigResult && (
          <div>
            <div className="text-sm">🚬 Cigarette equivalents today: <strong>~{cigResult.valueMid}</strong> cig-eq</div>
            <WhyDrawer result={cigResult} />
          </div>
        )}
        {commuteResult && (
          <div>
            <div className="text-sm">🚶 Commute inhaled: <strong>~{commuteResult.valueMid}</strong> µg</div>
            <WhyDrawer result={commuteResult} />
          </div>
        )}
        {indoorResult && (
          <div>
            <div className="text-sm">🏠 Indoor concentration: <strong>~{indoorResult.valueMid}</strong> µg/m³</div>
            <WhyDrawer result={indoorResult} />
          </div>
        )}
      </div>

      {/* Indoor hacks */}
      <div className="card space-y-2">
        <div className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Indoor air hacks (ranked by impact)</div>
        {[
          { icon: '⏰', label: 'Ventilate at lowest-AQI hours', cost: 'free', effect: 'High', why: 'Avoids inversion hours when pollution peaks indoors' },
          { icon: '🌀', label: 'Run purifier (CADR matched to room)', cost: lifestyle.purifier ? 'owned' : 'medium', effect: 'High', why: 'Removes fine particles via HEPA filtration' },
          { icon: '🔧', label: 'DIY box-fan + HEPA filter', cost: 'low', effect: 'Medium', why: 'Estimated 50–70% reduction at fraction of purifier cost' },
          { icon: '🪟', label: 'Seal window gaps with tape', cost: 'free', effect: 'Medium', why: 'Reduces infiltration factor significantly' },
          { icon: '🍳', label: 'Switch to induction cooking', cost: 'medium', effect: 'High', why: 'Gas cooking is a major indoor PM2.5 source' },
        ]
          .filter((h) => !lifestyle.budgetBand || lifestyle.budgetBand === 'high' || h.cost !== 'high')
          .slice(0, 4)
          .map((hack, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'var(--color-surface)' }}>
              <span className="text-lg">{hack.icon}</span>
              <div className="flex-1 text-sm">
                <div className="font-medium">{hack.label}</div>
                <div className="text-xs opacity-60">Cost: {hack.cost} · Effect: {hack.effect}</div>
                <div className="text-xs opacity-50 italic">{hack.why}</div>
              </div>
            </div>
          ))}
      </div>

      {/* 48h forecast strip */}
      {air?.forecast48h && air.forecast48h.length > 0 && (
        <div className="card">
          <div className="font-semibold text-sm mb-2" style={{ color: 'var(--color-primary)' }}>48-hour AQI forecast</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {air.forecast48h.slice(0, 24).map((f, i) => {
              const hour = new Date(f.hour).getHours();
              const aqi = Math.round(f.aqi);
              const bg = aqi <= 50 ? '#0d9488' : aqi <= 100 ? '#65a30d' : aqi <= 150 ? '#d97706' : aqi <= 300 ? '#c2410c' : '#e11d48';
              return (
                <div key={i} className="flex flex-col items-center shrink-0 text-xs">
                  <span className="opacity-50">{String(hour).padStart(2, '0')}h</span>
                  <div className="w-6 h-16 mt-1 rounded-sm flex flex-col justify-end" style={{ background: 'var(--color-surface)' }}>
                    <div className="rounded-sm" style={{ background: bg, height: `${Math.min(100, (aqi / 400) * 100)}%` }} />
                  </div>
                  <span className="mt-1 font-bold" style={{ color: bg }}>{aqi}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sustainable alternatives */}
      <div className="card space-y-2">
        <div className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Sustainable alternatives</div>
        {[
          { icon: '🚇', label: 'Metro or bus over car', exposureChange: -40, co2Change: -100, unit: 'g CO₂/trip' },
          { icon: '🚲', label: 'Cycle on low-traffic routes', exposureChange: -20, co2Change: -150, unit: 'g CO₂/trip' },
          { icon: '🏭', label: 'Engine-off at crossings', exposureChange: -5, co2Change: -20, unit: 'g CO₂' },
          { icon: '🏠', label: 'Work from home', exposureChange: -60, co2Change: -150, unit: 'g CO₂/day' },
        ].map((alt, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--color-surface)' }}>
            <span className="text-xl">{alt.icon}</span>
            <div className="flex-1 text-sm">
              <div className="font-medium">{alt.label}</div>
              <div className="text-xs opacity-60">
                ~{alt.exposureChange}% exposure · saves ~{alt.co2Change} {alt.unit}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Medical disclaimer */}
      <p className="text-xs opacity-40 text-center px-4">
        Airloom provides informational air quality and weather guidance and exposure estimates. It is not medical advice and never provides diagnoses or medication guidance.
      </p>
    </div>
  );
}
