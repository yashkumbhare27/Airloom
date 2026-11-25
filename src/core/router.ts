// core/router.ts – AI task router
import { logOutbound } from './db';

const PROXY_BASE = import.meta.env.VITE_PROXY_URL ?? '/api';
const CLOUD_MODEL = import.meta.env.VITE_CLOUD_MODEL ?? 'gemini-2.0-flash';

declare global {
  interface Window {
    ai?: {
      languageModel: {
        create: (opts: { systemPrompt: string }) => Promise<{
          prompt: (p: string) => Promise<string>;
        }>;
      };
    };
  }
}

function hasBuiltInAI(): boolean {
  return typeof window.ai !== 'undefined';
}

export interface AITask {
  type: string;
  systemPrompt: string;
  userPrompt: string;
  resultIds?: string[];
  schema?: string;
}

export interface AIResponse {
  text: string;
  source: 'on-device' | 'cloud-anonymised' | 'offline-template';
}

export async function routeAI(task: AITask, touchesPrivate = false): Promise<AIResponse> {
  // 1. Try on-device (Chrome built-in AI / Gemini Nano)
  if (hasBuiltInAI()) {
    try {
      const session = await window.ai!.languageModel.create({ systemPrompt: task.systemPrompt });
      const text = await session.prompt(task.userPrompt);
      await logOutbound({
        time: new Date().toISOString(),
        purpose: `ai_on_device_${task.type}`,
        destination: 'Gemini Nano (local)',
        fieldsSent: ['prompt_text'],
        bytesSent: task.userPrompt.length,
        onDevice: true,
      });
      return { text, source: 'on-device' };
    } catch {
      // fall through
    }
  }

  // 2. Cloud proxy (anonymised, no PII)
  if (!touchesPrivate) {
    try {
      const payload = {
        model: CLOUD_MODEL,
        task: task.type,
        systemPrompt: task.systemPrompt,
        userPrompt: task.userPrompt,
        resultIds: task.resultIds ?? [],
      };
      const res = await fetch(`${PROXY_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json() as { text?: string };
        await logOutbound({
          time: new Date().toISOString(),
          purpose: `ai_cloud_${task.type}`,
          destination: `${PROXY_BASE}/ai`,
          fieldsSent: ['task', 'systemPrompt', 'userPrompt', 'resultIds'],
          bytesSent: JSON.stringify(payload).length,
          onDevice: false,
        });
        return { text: data.text ?? '', source: 'cloud-anonymised' };
      }
    } catch {
      // fall through
    }
  }

  // 3. Offline template fallback
  return { text: offlineTemplate(task), source: 'offline-template' };
}

function offlineTemplate(task: AITask): string {
  if (task.type === 'chat') return "I'm offline right now. Check the Now screen for your current air quality and weather readings.";
  if (task.type === 'daily_brief') return 'Daily briefing unavailable offline. Open the app for live readings.';
  if (task.type === 'next_best_action') return 'Check the AQI card for immediate guidance.';
  return 'Currently offline. Live readings are available when connected.';
}
