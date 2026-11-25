// core/i18n.ts – thin i18n: English, Hindi, Marathi
export type Lang = 'en' | 'hi' | 'mr';

type Strings = {
  now: string; twin: string; lens: string; swarm: string; earth: string; me: string;
  aqi: string; pm25: string; fresh: string; fair: string; hazy: string; smog: string; severe: string;
  temperature: string; feelsLike: string; humidity: string; wind: string; rain: string; uv: string;
  morning: string; afternoon: string; evening: string; offline: string;
  addFamily: string; setupTitle: string; setupSub: string;
  hey_aero_on: string; hey_aero_off: string; listening: string;
  verdictFresh: string; verdictFair: string; verdictHazy: string; verdictSmog: string; verdictSevere: string;
  whyMatters: string; nextAction: string; listen: string; openAirloom: string;
};

const EN: Strings = {
  now: 'Now', twin: 'Twin', lens: 'Lens', swarm: 'Swarm', earth: 'Earth', me: 'Me',
  aqi: 'AQI', pm25: 'PM2.5', fresh: 'Fresh', fair: 'Fair', hazy: 'Hazy', smog: 'Smog', severe: 'Severe',
  temperature: 'Temperature', feelsLike: 'Feels like', humidity: 'Humidity', wind: 'Wind', rain: 'Rain', uv: 'UV',
  morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', offline: 'Offline',
  addFamily: 'Add your family', setupTitle: 'Welcome to Airloom', setupSub: 'Set up once to get personalised air and weather guidance.',
  hey_aero_on: 'Hey Aero on', hey_aero_off: 'Hey Aero off', listening: 'Listening…',
  verdictFresh: 'Air is clean — great day to be outside.',
  verdictFair: 'Air is acceptable. Sensitive groups, take short breaks.',
  verdictHazy: 'Hazy air. Limit outdoor time for sensitive members.',
  verdictSmog: 'Poor air quality. Wear N95 outside, run your purifier indoors.',
  verdictSevere: '🚨 Severe pollution. Stay indoors, seal gaps, purifier on max.',
  whyMatters: 'Why this matters', nextAction: 'Next best action', listen: 'Listen', openAirloom: 'Open Airloom',
};

const HI: Strings = {
  now: 'अभी', twin: 'ट्विन', lens: 'लेंस', swarm: 'स्वार्म', earth: 'अर्थ', me: 'मैं',
  aqi: 'AQI', pm25: 'PM2.5', fresh: 'स्वच्छ', fair: 'ठीक', hazy: 'धुंधला', smog: 'स्मॉग', severe: 'गंभीर',
  temperature: 'तापमान', feelsLike: 'महसूस होता है', humidity: 'नमी', wind: 'हवा', rain: 'बारिश', uv: 'UV',
  morning: 'सुप्रभात', afternoon: 'नमस्ते', evening: 'शुभ संध्या', offline: 'ऑफलाइन',
  addFamily: 'अपने परिवार को जोड़ें', setupTitle: 'Airloom में आपका स्वागत है', setupSub: 'व्यक्तिगत वायु और मौसम मार्गदर्शन के लिए एक बार सेटअप करें।',
  hey_aero_on: 'Hey Aero चालू', hey_aero_off: 'Hey Aero बंद', listening: 'सुन रहा हूं…',
  verdictFresh: 'हवा साफ है — बाहर जाने का बेहतरीन दिन।',
  verdictFair: 'हवा स्वीकार्य है। संवेदनशील लोग छोटे ब्रेक लें।',
  verdictHazy: 'धुंधली हवा। संवेदनशील सदस्यों के लिए बाहर का समय सीमित करें।',
  verdictSmog: 'खराब वायु गुणवत्ता। बाहर N95 पहनें, अंदर प्यूरीफायर चलाएं।',
  verdictSevere: '🚨 गंभीर प्रदूषण। घर के अंदर रहें, दरारें बंद करें, प्यूरीफायर पूरी क्षमता पर चलाएं।',
  whyMatters: 'यह क्यों मायने रखता है', nextAction: 'अगला सबसे अच्छा कदम', listen: 'सुनें', openAirloom: 'Airloom खोलें',
};

const MR: Strings = {
  now: 'आता', twin: 'ट्विन', lens: 'लेंस', swarm: 'स्वार्म', earth: 'अर्थ', me: 'मी',
  aqi: 'AQI', pm25: 'PM2.5', fresh: 'स्वच्छ', fair: 'ठीक', hazy: 'धुके', smog: 'धूर', severe: 'गंभीर',
  temperature: 'तापमान', feelsLike: 'वाटते', humidity: 'आर्द्रता', wind: 'वारा', rain: 'पाऊस', uv: 'UV',
  morning: 'सुप्रभात', afternoon: 'नमस्कार', evening: 'शुभ संध्या', offline: 'ऑफलाइन',
  addFamily: 'आपल्या कुटुंबाला जोडा', setupTitle: 'Airloom मध्ये आपले स्वागत आहे', setupSub: 'वैयक्तिक हवा आणि हवामान मार्गदर्शनासाठी एकदा सेटअप करा।',
  hey_aero_on: 'Hey Aero चालू', hey_aero_off: 'Hey Aero बंद', listening: 'ऐकत आहे…',
  verdictFresh: 'हवा स्वच्छ आहे — बाहर जाण्याचा उत्तम दिवस।',
  verdictFair: 'हवा स्वीकार्य आहे. संवेदनशील लोकांनी छोटे विराम घ्यावेत.',
  verdictHazy: 'धुके हवा. संवेदनशील सदस्यांसाठी बाहरचा वेळ कमी करा.',
  verdictSmog: 'खराब हवा गुणवत्ता. बाहर N95 घाला, आत प्युरिफायर चालवा.',
  verdictSevere: '🚨 गंभीर प्रदूषण. घरात राहा, फटी बंद करा, प्युरिफायर जास्तीत जास्त चालवा.',
  whyMatters: 'हे का महत्त्वाचे आहे', nextAction: 'पुढील सर्वोत्तम पाऊल', listen: 'ऐका', openAirloom: 'Airloom उघडा',
};

const LANGS: Record<Lang, Strings> = { en: EN, hi: HI, mr: MR };

export function t(key: keyof Strings, lang: Lang = 'en'): string {
  return LANGS[lang][key] ?? LANGS['en'][key] ?? key;
}

export function verdictForAqi(aqi: number, lang: Lang = 'en'): string {
  if (aqi <= 50) return t('verdictFresh', lang);
  if (aqi <= 100) return t('verdictFair', lang);
  if (aqi <= 150) return t('verdictHazy', lang);
  if (aqi <= 300) return t('verdictSmog', lang);
  return t('verdictSevere', lang);
}
