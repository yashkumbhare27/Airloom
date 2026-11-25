// AeroPanel.tsx – right-side Aero chat assistant
import { useState, useRef, useEffect } from 'react';
import { AeroVoice, buildIntentReply, parseIntent } from '../core/voice';
import { routeAI } from '../core/router';
import { db, getVoiceSettings } from '../core/db';
import type { ChatMessage } from '../core/db';
import type { AirSnapshot, WeatherSnapshot } from '../core/types';

interface Props {
  air: AirSnapshot | null;
  weather: WeatherSnapshot | null;
  onClose: () => void;
}

interface Msg {
  id: string;
  role: 'user' | 'aero';
  text: string;
  source?: string;
}

const SUGGESTIONS = [
  "What's the AQI now?",
  "Is it safe to exercise outside?",
  "Should I wear a mask?",
  "What's the weather today?",
  "Read my morning brief",
];

const aeroVoice = new AeroVoice();

export function AeroPanel({ air, weather, onClose }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [micState, setMicState] = useState<'idle' | 'listening' | 'wake-detected'>('idle');
  const [speakerOn, setSpeakerOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.chatMessages.orderBy('timestamp').last().then((msg: ChatMessage | undefined) => {
      // Load last 20 messages
      db.chatMessages.orderBy('timestamp').toArray().then((msgs: ChatMessage[]) => {
        const last20 = msgs.slice(-20);
        setMessages(last20.map((m) => ({ id: m.id, role: m.role, text: m.content, source: m.source })));
      });
    });

    aeroVoice.setCallbacks({
      onMicState: setMicState,
      onTranscript: (_t: string, final: boolean) => {
        if (final) addMsg('user', _t, 'on-device');
      },
      onReply: (reply: string, source: string) => {
        addMsg('aero', reply, source);
      },
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function addMsg(role: 'user' | 'aero', text: string, source: string) {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [...prev, { id, role, text, source }]);
    db.chatMessages.put({
      id, role, content: text,
      timestamp: new Date().toISOString(),
      source: source as 'on-device' | 'cloud-anonymised' | 'offline-template',
      spoken: false,
    });
  }

  async function send(text: string) {
    if (!text.trim()) return;
    addMsg('user', text, 'on-device');
    setInput('');
    setLoading(true);

    const airCtx = air ?? { usAqi: 0, pm25: 0, category: 'Fresh' as const };
    const weatherCtx = weather
      ? { tempC: weather.tempC, feelsLikeC: weather.feelsLikeC, conditionKey: weather.conditionKey, precipProbPct: weather.precipProbPct }
      : null;

    const intent = parseIntent(text);
    if (intent && intent.intent !== 'open_screen') {
      const reply = buildIntentReply(intent.intent, airCtx, weatherCtx);
      if (reply) {
        addMsg('aero', reply, 'on-device');
        if (speakerOn) {
          const vs = await getVoiceSettings();
          aeroVoice.speak(reply, vs);
        }
        setLoading(false);
        return;
      }
    }

    try {
      const result = await routeAI({
        type: 'chat',
        systemPrompt: `You are Aero, Airloom's warm and brief air quality assistant.
Current conditions: AQI ${airCtx.usAqi} (${airCtx.category}), PM2.5 ${airCtx.pm25}μg/m³.
${weatherCtx ? `Weather: ${weatherCtx.tempC}°C, ${weatherCtx.conditionKey}, ${weatherCtx.precipProbPct}% rain.` : ''}
Rules: Reply in 2-4 sentences. Never diagnose or recommend medication.
Use only the numbers provided above. Be warm and practical.`,
        userPrompt: text,
      });
      addMsg('aero', result.text, result.source);
      if (speakerOn && result.text) {
        const vs = await getVoiceSettings();
        aeroVoice.speak(result.text, vs);
      }
    } catch {
      addMsg('aero', "I couldn't reach my AI backend. Check your connection.", 'offline-template');
    }
    setLoading(false);
  }

  async function toggleMic() {
    if (micState !== 'idle') {
      aeroVoice.stop();
    } else {
      const airCtx = air ?? { usAqi: 0, pm25: 0, category: 'Fresh' as const };
      const weatherCtx = weather
        ? { tempC: weather.tempC, feelsLikeC: weather.feelsLikeC, conditionKey: weather.conditionKey, precipProbPct: weather.precipProbPct }
        : null;
      await aeroVoice.start(airCtx, weatherCtx);
    }
  }

  const sourceLabel: Record<string, string> = {
    'on-device': 'Ran locally on Gemini Nano',
    'cloud-anonymised': 'Cloud · anonymised',
    'offline-template': 'Offline template',
  };

  return (
    <aside
      className="w-80 flex flex-col border-l shrink-0 h-full"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-surface-2)' }}
      aria-label="Aero assistant"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--color-surface-2)' }}>
        <span className="text-lg">🌿</span>
        <span className="font-semibold flex-1" style={{ color: 'var(--color-primary)' }}>Aero</span>
        {micState === 'listening' && (
          <span className="chip text-xs animate-pulse bg-red-500 text-white">🎙️ Listening…</span>
        )}
        <button className="btn-ghost text-xs px-2" onClick={() => setSpeakerOn((p) => !p)}
          aria-label={speakerOn ? 'Mute speaker' : 'Unmute speaker'}>
          {speakerOn ? '🔊' : '🔇'}
        </button>
        <button className="text-sm opacity-70 hover:opacity-100 min-h-[48px] min-w-[48px]"
          onClick={onClose} aria-label="Close Aero">✕</button>
      </div>

      {/* Suggestion chips */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 p-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip text-xs cursor-pointer hover:opacity-80"
              style={{ background: 'var(--color-surface-2)' }}
              onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-[var(--color-primary)] text-white rounded-br-sm' : 'rounded-bl-sm'}`}
              style={m.role === 'aero' ? { background: 'var(--color-surface-2)' } : {}}
            >
              {m.text}
              {m.role === 'aero' && m.source && (
                <div className="text-xs opacity-50 mt-1">{sourceLabel[m.source] ?? m.source}</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3 py-2 text-sm animate-pulse" style={{ background: 'var(--color-surface-2)' }}>
              Aero is thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2 items-center" style={{ borderColor: 'var(--color-surface-2)' }}>
        <input
          className="flex-1 rounded-full px-4 py-2 text-sm border outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-surface-2)', color: 'var(--color-on-surface)' }}
          placeholder="Ask Aero…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          aria-label="Message to Aero"
        />
        <button
          className={`min-h-[48px] min-w-[48px] rounded-full text-lg flex items-center justify-center transition ${micState !== 'idle' ? 'bg-red-500 text-white animate-pulse' : 'bg-[var(--color-primary)] text-white'}`}
          onClick={toggleMic}
          aria-label={micState !== 'idle' ? 'Stop listening' : 'Push to talk'}
        >
          🎙️
        </button>
        <button className="btn-primary text-sm px-3" onClick={() => send(input)} aria-label="Send">➤</button>
      </div>
    </aside>
  );
}
