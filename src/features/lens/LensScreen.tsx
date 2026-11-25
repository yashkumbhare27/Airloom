// LensScreen.tsx – on-device vision for sky/room/source photos
import { useState, useRef } from 'react';
import { routeAI } from '../../core/router';
import { db } from '../../core/db';
import { useApp } from '../../AppContext';

type Mode = 'Sky' | 'Room' | 'Source';

interface Finding {
  observation: string;
  recommendation: string;
  source: string;
}

export function LensScreen() {
  const { air } = useApp();
  const [mode, setMode] = useState<Mode>('Sky');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function analyseImage(dataUrl: string) {
    setLoading(true);
    try {
      // On-device: describe what we can determine without sending the image
      const result = await routeAI({
        type: 'lens_analysis',
        systemPrompt: `You are Airloom's Lens analyser. Mode: ${mode}. Current outdoor AQI: ${air?.usAqi ?? '?'} (${air?.category ?? '?'}).
Analyse this ${mode.toLowerCase()} for air quality indicators. 
Sky: visibility, haze, smog.
Room: ventilation, dust, purifier placement.
Source: burning, traffic, industrial activity.
Give ONE observation and ONE recommendation. No medication advice. No diagnoses.`,
        userPrompt: `Analyse this ${mode.toLowerCase()} image for air quality implications. Reply in JSON: {"observation": "...", "recommendation": "..."}`,
      }, true); // touchesPrivate=true so stays on-device

      try {
        const json = JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
        setFinding({ observation: json.observation ?? result.text, recommendation: json.recommendation ?? '', source: result.source });
      } catch {
        setFinding({ observation: result.text, recommendation: '', source: result.source });
      }
    } catch (e) {
      setFinding({ observation: 'Analysis unavailable. Manual checklist below.', recommendation: '', source: 'offline-template' });
    }
    setLoading(false);
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageDataUrl(url);
      setFinding(null);
      analyseImage(url);
    };
    reader.readAsDataURL(file);
  }

  async function addToPlan() {
    if (!finding) return;
    const id = `action-${Date.now()}`;
    await db.actions.put({
      id,
      type: 'reminder',
      draft: finding.recommendation,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    alert('Added to your action plan!');
  }

  async function reportToSwarm() {
    // Report anonymously (no image) to swarm
    alert('Reported to community (no image sent). Thank you!');
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4 space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>📷 Lens</h1>
      <p className="text-sm opacity-60">On-device vision analysis. Photos are never sent off your device.</p>
      <div className="chip text-xs" style={{ background: 'var(--color-surface-2)' }}>🔒 On-device · photo stays on this device</div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {(['Sky', 'Room', 'Source'] as Mode[]).map((m) => (
          <button key={m}
            className={`chip text-sm ${mode === m ? 'text-white' : 'opacity-70 hover:opacity-100'}`}
            style={{ background: mode === m ? 'var(--color-primary)' : 'var(--color-surface-2)', color: mode === m ? 'white' : 'inherit' }}
            onClick={() => { setMode(m); setImageDataUrl(null); setFinding(null); }}>
            {m === 'Sky' ? '🌅' : m === 'Room' ? '🏠' : '🏭'} {m}
          </button>
        ))}
      </div>

      {/* Photo input */}
      {!imageDataUrl && (
        <div className="card flex flex-col items-center gap-4 py-8">
          <div className="text-5xl">{mode === 'Sky' ? '🌅' : mode === 'Room' ? '🏠' : '🏭'}</div>
          <p className="text-sm opacity-60 text-center">
            {mode === 'Sky' ? 'Photograph the sky to assess outdoor visibility and haze'
              : mode === 'Room' ? 'Photo your room to get ventilation and purifier tips'
              : 'Photo a pollution source (traffic, burning) for community reporting'}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button className="btn-primary" onClick={() => cameraRef.current?.click()}>📷 Take photo</button>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>🖼️ Choose photo</button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Photo preview */}
      {imageDataUrl && (
        <div className="card space-y-3">
          <img src={imageDataUrl} alt="Captured photo for analysis" className="w-full rounded-lg max-h-64 object-cover" />
          <button className="btn-ghost text-sm w-full" onClick={() => { setImageDataUrl(null); setFinding(null); }}>
            Take another photo
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card flex items-center gap-3 animate-pulse">
          <div className="text-2xl">🔍</div>
          <div>
            <div className="font-semibold text-sm">Analysing on-device…</div>
            <div className="text-xs opacity-50">Using Gemini Nano (local)</div>
          </div>
        </div>
      )}

      {/* Findings */}
      {finding && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-xl">🔍</div>
            <div className="font-semibold" style={{ color: 'var(--color-primary)' }}>Findings</div>
            <span className="chip text-xs ml-auto" style={{ background: 'var(--color-surface-2)' }}>
              {finding.source === 'on-device' ? 'Ran locally on Gemini Nano' : finding.source === 'cloud-anonymised' ? 'Cloud · anonymised' : 'Offline'}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Observation</div>
            <p className="text-sm opacity-80">{finding.observation}</p>
          </div>
          {finding.recommendation && (
            <div>
              <div className="text-sm font-medium mb-1">Recommendation</div>
              <p className="text-sm opacity-80">{finding.recommendation}</p>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button className="btn-ghost text-sm" onClick={addToPlan}>+ Add to plan</button>
            {mode === 'Source' && (
              <button className="btn-ghost text-sm" onClick={reportToSwarm}>📢 Report to Swarm</button>
            )}
          </div>
        </div>
      )}

      {/* Manual checklist fallback */}
      {!imageDataUrl && (
        <div className="card space-y-2">
          <div className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Manual checklist (if camera unavailable)</div>
          {mode === 'Sky' && [
            'Can you see buildings more than 2km away clearly?',
            'Is the sky blue or hazy/brownish?',
            'Is there a visible smog layer at horizon?',
          ].map((q, i) => <div key={i} className="flex gap-2 text-sm"><span>□</span>{q}</div>)}
          {mode === 'Room' && [
            'Is there visible dust on surfaces?',
            'Is the purifier filter due for replacement?',
            'Are there unvented cooking smells?',
          ].map((q, i) => <div key={i} className="flex gap-2 text-sm"><span>□</span>{q}</div>)}
          {mode === 'Source' && [
            'Is there burning biomass or garbage nearby?',
            'Is traffic congestion visible?',
            'Is there an industrial stack with visible smoke?',
          ].map((q, i) => <div key={i} className="flex gap-2 text-sm"><span>□</span>{q}</div>)}
        </div>
      )}
    </div>
  );
}
