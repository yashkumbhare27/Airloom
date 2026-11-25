// SetupFlow.tsx – first-run setup wizard
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveHousehold, saveLocation, saveLifestyle } from '../../core/db';
import { geocodeCity } from '../../core/air';
import { useApp } from '../../AppContext';
import type { Member, Lifestyle } from '../../core/types';

type Step = 'location' | 'members' | 'lifestyle' | 'language' | 'done';

export function SetupFlow() {
  const { refreshData } = useApp();
  const [step, setStep] = useState<Step>('location');
  const [locInput, setLocInput] = useState('');
  const [locResult, setLocResult] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [locError, setLocError] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberAge, setMemberAge] = useState('');
  const [memberFlags, setMemberFlags] = useState<Member['riskFlags']>([]);
  const [lifestyle, setLifestyle] = useState<Lifestyle>({});
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function detectLocation() {
    setLoading(true);
    setLocError('');
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      // Coarsen
      const cLat = Math.round(lat / 0.018) * 0.018;
      const cLng = Math.round(lng / 0.018) * 0.018;
      setLocResult({ lat: cLat, lng: cLng, label: `Your area (${cLat.toFixed(2)}, ${cLng.toFixed(2)})` });
    } catch {
      setLocError('Location access denied. Search for your city instead.');
    }
    setLoading(false);
  }

  async function searchCity() {
    if (!locInput.trim()) return;
    setLoading(true);
    const result = await geocodeCity(locInput);
    if (result) setLocResult(result);
    else setLocError('City not found. Try a different spelling.');
    setLoading(false);
  }

  function addMember() {
    if (!memberName || !memberAge) return;
    const m: Member = {
      id: `member-${Date.now()}`,
      name: memberName,
      age: parseInt(memberAge),
      riskFlags: memberFlags,
      commuteMode: 'walk',
    };
    setMembers((prev) => [...prev, m]);
    setMemberName(''); setMemberAge(''); setMemberFlags([]);
  }

  async function finish() {
    setLoading(true);
    if (locResult) await saveLocation({ ...locResult, coarsened: true });
    await saveHousehold({
      id: 'household',
      members,
      primaryMemberId: members[0]?.id ?? '',
      language: lang,
      explanationMode: 'standard',
      textSize: 'normal',
      reducedMotion: false,
      highContrast: false,
      setupComplete: true,
    });
    await saveLifestyle(lifestyle);
    await refreshData();
    navigate('/app');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md card space-y-5">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center">
          {(['location', 'members', 'lifestyle', 'language'] as Step[]).map((s) => (
            <div key={s} className={`w-2 h-2 rounded-full ${step === s ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`} />
          ))}
        </div>

        {step === 'location' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>🌿 Welcome to Airloom</h1>
            <p className="text-sm opacity-70">Set up once for personalised air quality and weather guidance. Your data never leaves this device.</p>
            <button className="btn-primary w-full" onClick={detectLocation} disabled={loading}>
              {loading ? 'Detecting…' : '📍 Use my location'}
            </button>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-surface-2)' }}
                placeholder="Or search city…"
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCity()}
              />
              <button className="btn-ghost" onClick={searchCity} disabled={loading}>Search</button>
            </div>
            {locError && <p className="text-sm text-red-500">{locError}</p>}
            {locResult && (
              <div className="chip" style={{ background: 'var(--color-surface-2)' }}>✅ {locResult.label}</div>
            )}
            <div className="flex justify-between pt-2">
              <button className="btn-ghost text-sm" onClick={() => {
                setLocResult({ lat: 18.63, lng: 73.8, label: 'Pimpri-Chinchwad, Maharashtra (fallback)' });
                setStep('members');
              }}>Skip</button>
              <button className="btn-primary" onClick={() => setStep('members')} disabled={!locResult}>Next →</button>
            </div>
          </div>
        )}

        {step === 'members' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>👨‍👩‍👧 Add family members</h2>
            <p className="text-sm opacity-70">Stored only on this device. Used to personalise guidance.</p>
            {members.length === 0 && <p className="text-sm opacity-50">No members yet. Add at least one.</p>}
            {members.map((m) => (
              <div key={m.id} className="chip" style={{ background: 'var(--color-surface-2)' }}>
                👤 {m.name}, {m.age}y {m.riskFlags.map((f) => ({ child: '👦', elderly: '👴', respiratory: '🫁', outdoor_exerciser: '🏃' }[f])).join('')}
              </div>
            ))}
            <div className="space-y-2">
              <input className="border rounded-lg px-3 py-2 text-sm w-full" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-surface-2)' }}
                placeholder="Name" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm w-full" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-surface-2)' }}
                placeholder="Age" type="number" value={memberAge} onChange={(e) => setMemberAge(e.target.value)} />
              <div className="flex flex-wrap gap-2 text-xs">
                {(['child', 'elderly', 'respiratory', 'outdoor_exerciser'] as Member['riskFlags'][number][]).map((f) => (
                  <label key={f} className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={memberFlags.includes(f)}
                      onChange={(e) => setMemberFlags((prev) => e.target.checked ? [...prev, f] : prev.filter((x) => x !== f))} />
                    {f.replace('_', ' ')}
                  </label>
                ))}
              </div>
              <button className="btn-ghost w-full text-sm" onClick={addMember} disabled={!memberName || !memberAge}>+ Add member</button>
            </div>
            <div className="flex justify-between">
              <button className="btn-ghost text-sm" onClick={() => setStep('location')}>← Back</button>
              <button className="btn-primary" onClick={() => setStep('lifestyle')} disabled={members.length === 0}>Next →</button>
            </div>
          </div>
        )}

        {step === 'lifestyle' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>🏠 Home & lifestyle basics</h2>
            <label className="block text-sm">Cooking fuel
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-surface-2)' }}
                value={lifestyle.cookingFuel ?? ''}
                onChange={(e) => setLifestyle((p) => ({ ...p, cookingFuel: e.target.value as Lifestyle['cookingFuel'] }))}>
                <option value="">Select…</option>
                <option value="gas">Gas (LPG/PNG)</option>
                <option value="induction">Induction</option>
                <option value="wood">Wood/Biomass</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block text-sm">Budget band
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-surface-2)' }}
                value={lifestyle.budgetBand ?? ''}
                onChange={(e) => setLifestyle((p) => ({ ...p, budgetBand: e.target.value as Lifestyle['budgetBand'] }))}>
                <option value="">Select…</option>
                <option value="free">Free only</option>
                <option value="low">Low (under ₹500)</option>
                <option value="medium">Medium (₹500–5000)</option>
                <option value="high">High (₹5000+)</option>
              </select>
            </label>
            <label className="block text-sm">Main commute mode
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-surface-2)' }}
                value={lifestyle.vehicle ?? ''}
                onChange={(e) => setLifestyle((p) => ({ ...p, vehicle: e.target.value }))}>
                <option value="">Select…</option>
                <option value="walk">Walk</option>
                <option value="cycle">Cycle</option>
                <option value="metro">Metro / Local train</option>
                <option value="bus">Bus</option>
                <option value="car_ac">Car (AC on)</option>
                <option value="car_windows_open">Car (windows open)</option>
              </select>
            </label>
            <div className="flex justify-between">
              <button className="btn-ghost text-sm" onClick={() => setStep('members')}>← Back</button>
              <button className="btn-primary" onClick={() => setStep('language')}>Next →</button>
            </div>
          </div>
        )}

        {step === 'language' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>🌐 Language & notifications</h2>
            <div className="space-y-2">
              {([['en', 'English'], ['hi', 'हिंदी (Hindi)'], ['mr', 'मराठी (Marathi)']] as ['en' | 'hi' | 'mr', string][]).map(([code, name]) => (
                <label key={code} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg" style={{ background: lang === code ? 'var(--color-primary)' : 'var(--color-surface-2)', color: lang === code ? 'white' : 'inherit' }}>
                  <input type="radio" name="lang" value={code} checked={lang === code} onChange={() => setLang(code)} className="sr-only" />
                  {name}
                </label>
              ))}
            </div>
            <div className="flex justify-between">
              <button className="btn-ghost text-sm" onClick={() => setStep('lifestyle')}>← Back</button>
              <button className="btn-primary" onClick={finish} disabled={loading}>
                {loading ? 'Setting up…' : '✅ Open Airloom'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
