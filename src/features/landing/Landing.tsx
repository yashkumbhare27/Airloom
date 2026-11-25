// Landing.tsx – landing page at "/"
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { CONDITION_ICON } from '../../core/constants';

export function Landing() {
  const { air, weather, category } = useApp();
  const navigate = useNavigate();

  const skyColors: Record<string, string> = {
    Fresh: 'from-teal-400 to-sky-300',
    Fair: 'from-lime-400 to-yellow-200',
    Hazy: 'from-amber-400 to-orange-200',
    Smog: 'from-orange-600 to-red-400',
    Severe: 'from-rose-900 to-red-800',
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Hero */}
      <section className={`relative min-h-[70vh] flex flex-col items-center justify-center bg-gradient-to-br ${skyColors[category] ?? skyColors.Hazy} text-white px-6`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-4">🌿</div>
          <h1 className="text-5xl font-black mb-3">Airloom</h1>
          <p className="text-xl opacity-90 mb-6">Privacy-first urban air quality and weather assistant. Your family's health data never leaves your device.</p>

          {/* Live AQI + weather overlay */}
          {air && (
            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
              <div className="bg-white/20 backdrop-blur rounded-2xl px-5 py-3 text-center">
                <div className="text-3xl font-black">{air.usAqi}</div>
                <div className="text-sm opacity-80">AQI · {air.category}</div>
              </div>
              {weather && (
                <div className="bg-white/20 backdrop-blur rounded-2xl px-5 py-3 text-center">
                  <div className="text-3xl">{CONDITION_ICON[weather.conditionKey] ?? '🌤️'} {Math.round(weather.tempC)}°C</div>
                  <div className="text-sm opacity-80">{weather.conditionKey.replace(/_/g, ' ')}</div>
                </div>
              )}
            </div>
          )}

          <button
            className="bg-white text-gray-900 font-bold text-lg px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1"
            onClick={() => navigate('/app')}
          >
            Open Airloom →
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10" style={{ color: 'var(--color-primary)' }}>How Airloom works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '📍', title: 'Live local data', desc: 'Air quality and weather for your exact (coarsened) location, refreshed every 15 minutes from Open-Meteo.' },
            { icon: '🤖', title: 'On-device AI', desc: 'Aero runs in your browser using Chrome built-in AI (Gemini Nano). Your conversations never leave your device.' },
            { icon: '👨‍👩‍👧', title: 'Family-first', desc: "Personalised guidance for each member's risk profile — kids, elderly, respiratory conditions, outdoor athletes." },
          ].map((step, i) => (
            <div key={i} className="card text-center">
              <div className="text-4xl mb-3">{step.icon}</div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm opacity-70">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy section */}
      <section className="max-w-4xl mx-auto px-6 py-12" style={{ background: 'var(--color-surface-2)' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>🔒 What stays on your device</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {['Family health profiles', 'Chat history with Aero', 'Photos taken with Lens', 'Voice transcripts', 'Your daily plans', 'Lifestyle data'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✅</span> {item}
            </div>
          ))}
        </div>
        <p className="text-xs opacity-50 mt-4">Only coarsened location (~2km accuracy) and anonymous air readings are sent to fetch live data.</p>
      </section>

      {/* CTA */}
      <section className="text-center px-6 py-16">
        <button
          className="btn-primary text-lg px-8 py-4"
          onClick={() => navigate('/app')}
        >
          Open Airloom →
        </button>
        <p className="text-xs opacity-40 mt-4">Free. No account. No ads. No data sold.</p>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs opacity-40 border-t" style={{ borderColor: 'var(--color-surface-2)' }}>
        Airloom provides informational air quality and weather guidance. Not medical advice.
        Air data: Open-Meteo Air Quality API · Weather: Open-Meteo Forecast API
      </footer>
    </div>
  );
}
