// Shell.tsx – left rail, top bar, right Aero panel
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { AeroPanel } from './AeroPanel';

const NAV = [
  { to: '/app', label: 'Now', icon: '🌡️', end: true },
  { to: '/app/twin', label: 'Twin', icon: '📊', end: false },
  { to: '/app/lens', label: 'Lens', icon: '📷', end: false },
  { to: '/app/swarm', label: 'Swarm', icon: '🗺️', end: false },
  { to: '/app/earth', label: 'Earth', icon: '🌍', end: false },
  { to: '/app/me', label: 'Me', icon: '👤', end: false },
] as const;

export function Shell() {
  const { air, weather, location, household, loading, category, refreshData } = useApp();
  const [aeroOpen, setAeroOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && household === null) navigate('/setup');
  }, [loading, household, navigate]);

  const aqiBg: Record<string, string> = {
    Fresh: 'bg-teal-500', Fair: 'bg-lime-500', Hazy: 'bg-amber-500',
    Smog: 'bg-orange-600', Severe: 'bg-rose-700',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* ── Left Rail (desktop) */}
      <nav
        className="hidden md:flex flex-col w-16 lg:w-48 py-4 gap-1 shrink-0"
        style={{ background: 'var(--color-rail)', color: 'var(--color-rail-fg)' }}
        aria-label="Main navigation"
      >
        <div className="px-3 mb-4">
          <span className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
            <span className="hidden lg:inline">🌿 Airloom</span>
            <span className="lg:hidden">🌿</span>
          </span>
        </div>

        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg min-h-[48px] transition font-medium text-sm
               ${isActive ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-primary)]/10'}`
            }
          >
            <span className="text-xl" aria-hidden>{n.icon}</span>
            <span className="hidden lg:inline">{n.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center gap-3 px-4 py-2 shrink-0 border-b"
          style={{ borderColor: 'var(--color-surface-2)', background: 'var(--color-surface)' }}
        >
          <span className="font-bold text-base md:hidden" style={{ color: 'var(--color-primary)' }}>🌿</span>

          <button
            className="chip text-xs"
            style={{ background: 'var(--color-surface-2)' }}
            onClick={() => navigate('/app/me')}
            aria-label="Change location"
          >
            📍 {location?.label ?? 'Set location'}
          </button>

          <span
            className={`chip text-xs text-white ${aqiBg[category] ?? 'bg-amber-500'}`}
            aria-label={`Air quality: ${category}, AQI ${air?.usAqi ?? '–'}`}
          >
            {category} · {air?.usAqi ?? '–'}
          </span>

          <div className="flex-1" />

          <span className="chip text-xs hidden sm:inline-flex" style={{ background: 'var(--color-surface-2)' }}
            title="Your data never leaves this device">
            🔒 On-device
          </span>

          <button className="btn-ghost text-xs px-3" onClick={refreshData} aria-label="Refresh data">↻</button>

          <button
            className="btn-primary text-sm"
            onClick={() => setAeroOpen((p) => !p)}
            aria-label="Open Aero assistant"
          >
            🎙️ Aero
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ── Aero panel */}
      {aeroOpen && (
        <AeroPanel
          air={air}
          weather={weather}
          onClose={() => setAeroOpen(false)}
        />
      )}

      {/* ── Bottom nav (mobile) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-2 border-t z-30"
        style={{ background: 'var(--color-rail)', borderColor: 'var(--color-surface-2)' }}
        aria-label="Mobile navigation"
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-h-[48px] min-w-[48px] text-xs
               ${isActive ? 'text-[var(--color-primary)] font-bold' : 'opacity-70'}`
            }
          >
            <span className="text-xl">{n.icon}</span>
            <span style={{ fontSize: '10px' }}>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
