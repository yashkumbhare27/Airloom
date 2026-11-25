// EarthScreen.tsx – Google Maps / satellite / offline hex view
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../AppContext';

type ViewMode = '3D Earth' | 'Satellite' | 'Offline summary';

declare global {
  interface Window {
    initAirloomMap?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}

export function EarthScreen() {
  const { location, air } = useApp();
  const mapRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('Satellite');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const MAPS_KEY = import.meta.env.VITE_MAPS_KEY;

  useEffect(() => {
    if (!location || !MAPS_KEY || !mapRef.current) {
      if (!MAPS_KEY) setViewMode('Offline summary');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=initAirloomMap`;
    script.async = true;
    script.onerror = () => {
      setMapError('Maps failed to load');
      setViewMode('Offline summary');
    };

    const timeout = setTimeout(() => {
      if (!mapLoaded) {
        setMapError('Maps timed out after 5s');
        setViewMode('Offline summary');
      }
    }, 5000);

    window.initAirloomMap = () => {
      clearTimeout(timeout);
      try {
        if (!window.google || !mapRef.current) return;
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: location.lat, lng: location.lng },
          zoom: 12,
          mapTypeId: 'satellite',
          tilt: 45,
        });
        new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map,
          title: `AQI ${air?.usAqi ?? '?'} · ${air?.category ?? '?'}`,
          label: { text: `${air?.usAqi ?? '?'}`, color: 'white', fontWeight: 'bold' },
        });
        setMapLoaded(true);
        setViewMode('Satellite');
      } catch (e) {
        setMapError('Map render error');
        setViewMode('Offline summary');
      }
    };

    document.head.appendChild(script);
    return () => {
      clearTimeout(timeout);
      delete window.initAirloomMap;
      document.head.removeChild(script);
    };
  }, [location, MAPS_KEY, mapLoaded, air]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 pb-2">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>🌍 Earth View</h1>
        <span className="chip text-xs ml-auto" style={{ background: 'var(--color-surface-2)' }}>{viewMode}</span>
        <button className="btn-ghost text-xs" onClick={() =>
          setViewMode((p) => p === 'Satellite' ? 'Offline summary' : 'Satellite')
        }>
          Switch view
        </button>
      </div>

      {mapError && (
        <div className="mx-4 mb-2 p-2 rounded-lg text-xs bg-amber-100 text-amber-800">
          ⚠️ {mapError} — showing offline summary
        </div>
      )}

      <div className="flex-1 relative mx-4 mb-4 rounded-xl overflow-hidden" style={{ minHeight: '400px' }}>
        {viewMode !== 'Offline summary' && MAPS_KEY ? (
          <div ref={mapRef} className="w-full h-full" aria-label="Satellite map with AQI overlay" style={{ minHeight: '400px' }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)', minHeight: '400px' }}>
            <div className="text-white text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <div className="text-xl font-bold">{MAPS_KEY ? 'Map unavailable' : 'Map not configured'}</div>
              <div className="text-sm opacity-70 mt-1">
                {MAPS_KEY ? 'Showing cached community summary' : 'Add VITE_MAPS_KEY to .env to enable satellite view'}
              </div>
            </div>

            <svg viewBox="0 0 300 200" className="w-64" aria-label="Offline hex grid">
              {[
                { cx: 80, cy: 80, label: 'Clear', col: '#0d9488' },
                { cx: 160, cy: 60, label: 'Haze', col: '#d97706' },
                { cx: 220, cy: 100, label: 'Clear', col: '#0d9488' },
                { cx: 120, cy: 140, label: 'Smoke', col: '#6b7280' },
                { cx: 200, cy: 160, label: 'Clear', col: '#0d9488' },
              ].map((h, i) => {
                const r = 30;
                const pts = Array.from({ length: 6 }, (_, k) => {
                  const angle = (Math.PI / 3) * k;
                  return `${h.cx + r * Math.cos(angle)},${h.cy + r * Math.sin(angle)}`;
                }).join(' ');
                return (
                  <g key={i}>
                    <polygon points={pts} fill={h.col} stroke="white" strokeWidth="1" opacity={0.7} />
                    <text x={h.cx} y={h.cy + 4} textAnchor="middle" fill="white" fontSize="8">{h.label}</text>
                  </g>
                );
              })}
            </svg>

            <div className="text-white text-center">
              <div className="text-2xl font-black">AQI {air?.usAqi ?? '?'}</div>
              <div className="text-sm opacity-70">{air?.category ?? '?'} · {location?.label ?? 'Unknown area'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
