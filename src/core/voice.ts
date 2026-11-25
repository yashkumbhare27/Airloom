// core/voice.ts – Aero voice assistant
import { routeAI } from './router';
import { getVoiceSettings } from './db';

type VoiceCallback = (transcript: string, isFinal: boolean) => void;
type AeroReplyCallback = (reply: string, source: string) => void;

// Extend window types for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
  interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((ev: SpeechRecognitionEventInstance) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }
  interface SpeechRecognitionEventInstance extends Event {
    results: SpeechRecognitionResultList;
  }
}

const WAKE_VARIANTS = [
  'hey aero', 'hey arrow', 'hi aero', 'okay aero', 'hey airo',
  'हे अरो', 'हाय अरो', 'हे एरो',
];

export function matchesWake(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim();
  return WAKE_VARIANTS.some((w) => lower.startsWith(w));
}

export function stripWake(transcript: string): string {
  const lower = transcript.toLowerCase().trim();
  for (const w of WAKE_VARIANTS) {
    if (lower.startsWith(w)) return transcript.slice(w.length).trim();
  }
  return transcript;
}

export function parseIntent(text: string): { intent: string; params?: Record<string, string> } | null {
  const t = text.toLowerCase().trim().replace(/[?.!,]/g, '');
  if (/weather (today|now)|what.*weather/.test(t)) return { intent: 'weather_today' };
  if (/weather tomorrow/.test(t)) return { intent: 'weather_tomorrow' };
  if (/temperature/.test(t)) return { intent: 'temperature_now' };
  if (/aqi|air quality|pollution/.test(t)) return { intent: 'aqi_now' };
  if (/safe (to go|outside|play)/.test(t)) return { intent: 'is_safe_outside' };
  if (/wear.*mask/.test(t)) return { intent: 'should_wear_mask' };
  if (/morning brief|daily brief|what.*today/.test(t)) return { intent: 'daily_brief' };
  if (/will it rain/.test(t)) return { intent: 'rain_check' };
  if (/stop/.test(t)) return { intent: 'stop' };
  if (/open.*now|go.*now screen/.test(t)) return { intent: 'open_screen', params: { screen: 'now' } };
  if (/open.*twin/.test(t)) return { intent: 'open_screen', params: { screen: 'twin' } };
  return null;
}

type AirCtx = { usAqi: number; pm25: number; category: string };
type WeatherCtx = { tempC: number; feelsLikeC: number; conditionKey: string; precipProbPct: number } | null;

export function buildIntentReply(intent: string, air: AirCtx, weather: WeatherCtx): string {
  const tod = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  switch (intent) {
    case 'weather_today':
      return weather
        ? `${tod}. It's ${Math.round(weather.tempC)} degrees, feels like ${Math.round(weather.feelsLikeC)}, ${weather.conditionKey.replace(/_/g, ' ')} with a ${weather.precipProbPct}% chance of rain. Air is ${air.category} at ${air.usAqi}.`
        : `${tod}. Air is ${air.category} at AQI ${air.usAqi}. Weather data unavailable.`;
    case 'weather_tomorrow':
      return "Check the Forecast section for tomorrow's outlook.";
    case 'temperature_now':
      return weather ? `It's currently ${Math.round(weather.tempC)} degrees, feeling like ${Math.round(weather.feelsLikeC)}.` : 'Temperature data unavailable right now.';
    case 'aqi_now':
      return `Air quality is ${air.category} at AQI ${air.usAqi}. PM2.5 is ${air.pm25} micrograms per cubic metre.`;
    case 'is_safe_outside':
      if (air.usAqi <= 100) return 'Yes, air quality is acceptable for most people. Sensitive groups should take short breaks.';
      if (air.usAqi <= 150) return 'Air is Hazy. Sensitive groups should limit outdoor time. Others can go out briefly.';
      if (air.usAqi <= 300) return 'Air quality is poor. Limit outdoor activity and wear an N95 if you need to go out.';
      return 'Air quality is Severe. Avoid going outside. Seal gaps and run your purifier.';
    case 'should_wear_mask':
      return air.usAqi > 100
        ? 'Yes, an N95 is recommended today given current air quality.'
        : 'Not essential today, but keep one handy.';
    case 'daily_brief':
      return weather
        ? `${tod}. Today will be ${Math.round(weather.tempC)} degrees with ${weather.conditionKey.replace(/_/g, ' ')}. Air is ${air.category} at ${air.usAqi}. ${air.usAqi > 100 ? 'Limit outdoor activity and use your purifier.' : 'Conditions are manageable today.'}`
        : `${tod}. Air is ${air.category} at AQI ${air.usAqi}.`;
    case 'rain_check':
      return weather
        ? `There's a ${weather.precipProbPct}% chance of rain today.`
        : 'Rain forecast unavailable right now.';
    default:
      return '';
  }
}

export class AeroVoice {
  private recognition: SpeechRecognitionInstance | null = null;
  private synthesis = window.speechSynthesis;
  private wakeEnabled = false;
  private listening = false;
  private onTranscript: VoiceCallback = () => {};
  private onReply: AeroReplyCallback = () => {};
  private onMicState: (state: 'idle' | 'listening' | 'wake-detected') => void = () => {};

  constructor() {
    const SRClass = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (SRClass) {
      this.recognition = new SRClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
    }
  }

  setCallbacks(opts: {
    onTranscript?: VoiceCallback;
    onReply?: AeroReplyCallback;
    onMicState?: (s: 'idle' | 'listening' | 'wake-detected') => void;
  }) {
    if (opts.onTranscript) this.onTranscript = opts.onTranscript;
    if (opts.onReply) this.onReply = opts.onReply;
    if (opts.onMicState) this.onMicState = opts.onMicState;
  }

  async start(air: AirCtx, weather: WeatherCtx) {
    if (!this.recognition) return;
    const vs = await getVoiceSettings();
    this.wakeEnabled = vs.wakeEnabled;
    this.recognition.lang = vs.voiceLang;

    this.recognition.onresult = async (ev: SpeechRecognitionEventInstance) => {
      const result = ev.results[ev.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      this.onTranscript(transcript, isFinal);

      if (!isFinal) return;

      let command = transcript;

      if (this.wakeEnabled) {
        if (!matchesWake(transcript)) return;
        command = stripWake(transcript);
        this.onMicState('wake-detected');
      }

      const intent = parseIntent(command);
      if (intent?.intent === 'stop') {
        this.stop();
        return;
      }

      let replyText = '';
      let source = 'on-device';

      if (intent) {
        replyText = buildIntentReply(intent.intent, air, weather);
        source = 'on-device';
      } else {
        const aiResult = await routeAI({
          type: 'chat',
          systemPrompt: `You are Aero, Airloom's assistant. Current AQI: ${air.usAqi} (${air.category}), PM2.5: ${air.pm25}. Weather: ${weather?.tempC}°C, ${weather?.conditionKey}. Reply warmly in 2–4 spoken sentences. Never diagnose or recommend medication. Numbers only from provided data.`,
          userPrompt: command,
          resultIds: [],
        });
        replyText = aiResult.text;
        source = aiResult.source;
      }

      this.onReply(replyText, source);
      if (vs.speakReplies) this.speak(replyText, vs);
    };

    this.recognition.onend = () => {
      if (this.listening) this.recognition?.start();
      else this.onMicState('idle');
    };

    this.listening = true;
    this.recognition.start();
    this.onMicState('listening');
  }

  stop() {
    this.listening = false;
    this.recognition?.stop();
    this.synthesis.cancel();
    this.onMicState('idle');
  }

  async speak(text: string, vs?: { voiceLang: string; rate: number; pitch: number }) {
    this.synthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = vs?.voiceLang ?? 'en-IN';
    utter.rate = vs?.rate ?? 1;
    utter.pitch = vs?.pitch ?? 1;
    const voices = this.synthesis.getVoices();
    const match = voices.find((v) => v.lang === utter.lang) ?? voices.find((v) => v.lang.startsWith('en'));
    if (match) utter.voice = match;
    this.synthesis.speak(utter);
  }

  get isListening() { return this.listening; }
  get supported() { return this.recognition !== null; }
}
