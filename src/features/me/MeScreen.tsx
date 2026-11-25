// MeScreen.tsx – household editor, voice/notification settings, privacy log
import { useState, useEffect } from 'react';
import { useApp } from '../../AppContext';
import { getHousehold, saveHousehold, getVoiceSettings, saveVoiceSettings, getNotificationPrefs, saveNotificationPrefs, db } from '../../core/db';
import type { VoiceSettings, NotificationPrefs } from '../../core/types';
import type { HouseholdDoc } from '../../core/db';

export function MeScreen() {
  const { lang, setLang, refreshData } = useApp();
  const [household, setHousehold] = useState<HouseholdDoc | null>(null);
  const [voice, setVoice] = useState<VoiceSettings | null>(null);
  const [notif, setNotif] = useState<NotificationPrefs | null>(null);
  const [outboundLog, setOutboundLog] = useState<{ time: string; purpose: string; destination: string; bytesSent: number; onDevice: boolean }[]>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'household' | 'voice' | 'privacy'>('household');
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    getHousehold().then((h) => h && setHousehold(h));
    getVoiceSettings().then(setVoice);
    getNotificationPrefs().then(setNotif);
    db.outboundLog.orderBy('time').reverse().limit(20).toArray().then(setOutboundLog);
  }, []);

  async function saveAll() {
    setSaving(true);
    if (household) await saveHousehold(household);
    if (voice) await saveVoiceSettings(voice);
    if (notif) await saveNotificationPrefs(notif);
    setSaving(false);
  }

  async function requestPushNotification() {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('Airloom notifications enabled!', {
          body: 'You will receive daily air quality briefings.',
          icon: '/icons/icon-192.png',
        });
      }
    }
  }

  async function deleteAllData() {
    if (!confirm('Delete ALL data? This cannot be undone.')) return;
    await db.delete();
    location.reload();
  }

  const piiLeaks = outboundLog.filter((e) => !e.onDevice && e.bytesSent > 100).length;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4 space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>👤 Me & Privacy</h1>

      {/* Tab selector */}
      <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--color-surface-2)' }}>
        {(['household', 'voice', 'privacy'] as const).map((t) => (
          <button key={t}
            className={`text-sm px-3 py-1 rounded-t-lg capitalize transition ${tab === t ? 'font-bold border-b-2' : 'opacity-60'}`}
            style={{ borderBottomColor: tab === t ? 'var(--color-primary)' : 'transparent' }}
            onClick={() => setTab(t)}>
            {t === 'household' ? '👨‍👩‍👧 Household' : t === 'voice' ? '🎙️ Voice & Notifications' : '🔒 Privacy'}
          </button>
        ))}
      </div>

      {/* Household tab */}
      {tab === 'household' && household && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="font-semibold">Language</div>
            <div className="flex gap-2">
              {([['en', 'English'], ['hi', 'हिंदी'], ['mr', 'मराठी']] as ['en' | 'hi' | 'mr', string][]).map(([code, name]) => (
                <button key={code}
                  className={`chip text-sm ${household.language === code ? 'text-white' : 'opacity-70'}`}
                  style={{ background: household.language === code ? 'var(--color-primary)' : 'var(--color-surface-2)', color: household.language === code ? 'white' : 'inherit' }}
                  onClick={() => { setHousehold({ ...household, language: code }); setLang(code); }}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-3">
            <div className="font-semibold">Explanation mode</div>
            <div className="flex flex-wrap gap-2">
              {(['standard', 'kid', 'grandparent', 'technical'] as HouseholdDoc['explanationMode'][]).map((m) => (
                <button key={m}
                  className={`chip text-sm capitalize ${household.explanationMode === m ? 'text-white' : 'opacity-70'}`}
                  style={{ background: household.explanationMode === m ? 'var(--color-primary)' : 'var(--color-surface-2)', color: household.explanationMode === m ? 'white' : 'inherit' }}
                  onClick={() => setHousehold({ ...household, explanationMode: m })}>
                  {m === 'kid' ? '👦 Kid' : m === 'grandparent' ? '👴 Grandparent' : m === 'technical' ? '🔬 Technical' : '📖 Standard'}
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-3">
            <div className="font-semibold">Accessibility</div>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={household.reducedMotion}
                onChange={(e) => setHousehold({ ...household, reducedMotion: e.target.checked })} />
              Reduced motion
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={household.highContrast}
                onChange={(e) => setHousehold({ ...household, highContrast: e.target.checked })} />
              High contrast
            </label>
          </div>

          <div className="card space-y-2">
            <div className="font-semibold">Family members</div>
            {household.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--color-surface)' }}>
                <span>👤 {m.name}, {m.age}y</span>
                <span className="text-xs opacity-50">{m.riskFlags.join(', ')}</span>
                <button className="ml-auto text-xs text-red-400" onClick={() => setHousehold({ ...household, members: household.members.filter((x) => x.id !== m.id) })}>Remove</button>
              </div>
            ))}
            <button className="btn-ghost text-sm w-full" onClick={() => alert('Go through Setup to add members')}>+ Add member</button>
          </div>

          <button className="btn-primary w-full" onClick={saveAll} disabled={saving}>
            {saving ? 'Saving…' : '✅ Save changes'}
          </button>
        </div>
      )}

      {/* Voice & Notifications tab */}
      {tab === 'voice' && voice && notif && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="font-semibold">🎙️ Hey Aero wake phrase</div>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={voice.wakeEnabled}
                onChange={(e) => setVoice({ ...voice, wakeEnabled: e.target.checked })} />
              Enable "Hey Aero" wake phrase
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={voice.speakReplies}
                onChange={(e) => setVoice({ ...voice, speakReplies: e.target.checked })} />
              Aero speaks replies aloud
            </label>
            <div>
              <label className="text-sm block mb-1">Voice language</label>
              <select className="border rounded-lg px-3 py-2 text-sm w-full" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-surface-2)' }}
                value={voice.voiceLang}
                onChange={(e) => setVoice({ ...voice, voiceLang: e.target.value as VoiceSettings['voiceLang'] })}>
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi</option>
                <option value="mr-IN">Marathi</option>
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1">Speech rate: {voice.rate}x</label>
              <input type="range" min={0.5} max={2} step={0.1} value={voice.rate}
                onChange={(e) => setVoice({ ...voice, rate: +e.target.value })} className="w-full" />
            </div>
            <button className="btn-ghost text-sm" onClick={() => {
              const utter = new SpeechSynthesisUtterance('Hey, this is Aero. Air quality is ' + (voice.voiceLang === 'hi-IN' ? 'ठीक' : 'fair') + ' today.');
              utter.lang = voice.voiceLang; utter.rate = voice.rate; utter.pitch = voice.pitch;
              window.speechSynthesis.speak(utter);
            }}>🔊 Test Aero voice</button>
          </div>

          <div className="card space-y-3">
            <div className="font-semibold">🔔 Daily notifications</div>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={notif.dailyEnabled}
                onChange={(e) => setNotif({ ...notif, dailyEnabled: e.target.checked })} />
              Daily air & weather briefing
            </label>
            {notif.dailyEnabled && (
              <div>
                <label className="text-sm block mb-1">Briefing time</label>
                <input type="time" value={notif.dailyTime}
                  onChange={(e) => setNotif({ ...notif, dailyTime: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-surface-2)' }} />
              </div>
            )}
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={notif.severeAlertEnabled}
                onChange={(e) => setNotif({ ...notif, severeAlertEnabled: e.target.checked })} />
              Severe smog alert (AQI &gt; {notif.severeThreshold})
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={notif.rainAlertEnabled}
                onChange={(e) => setNotif({ ...notif, rainAlertEnabled: e.target.checked })} />
              Rain alert
            </label>
            <button className="btn-ghost text-sm" onClick={requestPushNotification}>Enable push notifications</button>
            <button className="btn-ghost text-sm" onClick={() => {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Airloom test', { body: 'AQI is ' + (window as Window & { __airloomAqi?: number }).__airloomAqi + ' — test notification works!' });
              } else requestPushNotification();
            }}>📱 Send test notification</button>
          </div>

          <button className="btn-primary w-full" onClick={saveAll} disabled={saving}>
            {saving ? 'Saving…' : '✅ Save settings'}
          </button>
        </div>
      )}

      {/* Privacy tab */}
      {tab === 'privacy' && (
        <div className="space-y-4">
          <div className="card space-y-2">
            <div className="font-semibold">🔒 Privacy summary</div>
            <div className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>0</div>
            <div className="text-sm">personal fields shared in outbound requests</div>
            <p className="text-xs opacity-60">
              Only coarsened location (~2km), air readings, and anonymous counters are sent.
              Your name, age, health conditions, photos and voice transcripts never leave this device.
            </p>
          </div>

          <div className="card space-y-2">
            <div className="font-semibold text-sm">📋 What left your device (last 20 events)</div>
            {outboundLog.length === 0 ? (
              <p className="text-sm opacity-50">No outbound events yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {outboundLog.map((e, i) => (
                  <div key={i} className="p-2 rounded-lg text-xs" style={{ background: 'var(--color-surface)' }}>
                    <div className="flex gap-2">
                      <span>{e.onDevice ? '🔒 On-device' : '🌐 Cloud'}</span>
                      <span className="font-medium">{e.purpose}</span>
                      <span className="ml-auto opacity-50">{new Date(e.time).toLocaleTimeString()}</span>
                    </div>
                    <div className="opacity-50 mt-0.5">→ {e.destination} · {e.bytesSent}B</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card space-y-3">
            <div className="font-semibold text-sm">Export & delete</div>
            <button className="btn-ghost w-full text-sm" onClick={async () => {
              const data = await db.household.toArray();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'airloom-data.json'; a.click();
            }}>📥 Export my data</button>
            <button className="text-red-500 text-sm w-full py-2 hover:opacity-80 transition" onClick={deleteAllData}>
              🗑️ Delete everything (wipe IndexedDB + caches)
            </button>
          </div>

          <div className="text-xs opacity-40 text-center">
            Airloom provides informational guidance only. Not medical advice. Never diagnoses or medication guidance.
          </div>
        </div>
      )}
    </div>
  );
}
