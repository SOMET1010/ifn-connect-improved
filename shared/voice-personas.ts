export type VoicePersona = 'tantie' | 'pro' | 'ambianceur';

export interface VoicePersonaConfig {
  id: VoicePersona;
  name: string;
  description: string;
  voice: string;
  useCases: string[];
  tonality: string;
  rate?: number;
  pitch?: number;
}

export const VOICE_PERSONAS: Record<VoicePersona, VoicePersonaConfig> = {
  tantie: {
    id: 'tantie',
    name: 'Tantie Sagesse',
    description: 'Voix maternelle, rassurante, un peu grave. La "Maman du marché".',
    voice: 'tantie',
    tonality: 'Calme, posée, accent ivoirien standard mais marqué',
    useCases: [
      'Onboarding (première connexion)',
      'Messages d\'aide et tutoriels',
      'Alertes de sécurité importantes',
      'Confirmations de transactions importantes',
      'Messages d\'encouragement',
      'Explication des erreurs critiques'
    ],
    rate: 0.85,
    pitch: 0.95,
  },
  pro: {
    id: 'pro',
    name: 'Le Pro',
    description: 'Voix nette, précise, respectueuse. Le professionnel de confiance.',
    voice: 'pro',
    tonality: 'Net, précis, respectueux, neutre',
    useCases: [
      'Confirmation de solde',
      'Lecture des montants',
      'Récapitulatif de transactions',
      'Notifications de paiement',
      'Informations bancaires (CNPS, CMU)',
      'Données chiffrées et statistiques'
    ],
    rate: 0.9,
    pitch: 1.0,
  },
  ambianceur: {
    id: 'ambianceur',
    name: 'L\'Ambianceur',
    description: 'Voix joviale, dynamique, type "Gbairai". Le motivateur.',
    voice: 'ambianceur',
    tonality: 'Jovial, Nouchi léger, énergique',
    useCases: [
      'Félicitations ("Transaction validée, tu es un chef !")',
      'Déblocage de badges',
      'Atteinte d\'objectifs',
      'Notifications de récompenses',
      'Messages de gamification',
      'Encouragements quotidiens'
    ],
    rate: 1.0,
    pitch: 1.05,
  },
};

export interface VoiceContext {
  context: 'onboarding' | 'transaction' | 'security' | 'gamification' | 'help' | 'error' | 'success' | 'information';
  importance: 'high' | 'medium' | 'low';
}

export function selectPersonaForContext(context: VoiceContext['context'], importance?: VoiceContext['importance']): VoicePersona {
  const contextMap: Record<VoiceContext['context'], VoicePersona> = {
    onboarding: 'tantie',
    transaction: 'pro',
    security: 'tantie',
    gamification: 'ambianceur',
    help: 'tantie',
    error: 'tantie',
    success: 'ambianceur',
    information: 'pro',
  };

  if (importance === 'high' && context === 'transaction') {
    return 'tantie';
  }

  return contextMap[context];
}

export interface PhoneticRule {
  word: string;
  phonetic: string;
  language: 'dioula' | 'baule' | 'nouchi';
}

export const PHONETIC_DICTIONARY: PhoneticRule[] = [
  { word: 'wari', phonetic: 'wa-ri', language: 'dioula' },
  { word: 'gbairai', phonetic: 'gba-i-raï', language: 'nouchi' },
  { word: 'goumin', phonetic: 'gou-minn', language: 'nouchi' },
  { word: 'dja', phonetic: 'dja', language: 'nouchi' },
  { word: 'go', phonetic: 'go', language: 'nouchi' },
  { word: 'tchoko', phonetic: 'tcho-ko', language: 'nouchi' },
  { word: 'dôrôbô', phonetic: 'dô-rô-bô', language: 'nouchi' },
  { word: 'môgô', phonetic: 'mô-gô', language: 'dioula' },
  { word: 'i ni ce', phonetic: 'i-ni-ssé', language: 'dioula' },
  { word: "an'ka", phonetic: 'ann-ka', language: 'dioula' },
  { word: 'feereli', phonetic: 'fé-ré-li', language: 'dioula' },
  { word: 'kosɔbɛ', phonetic: 'ko-so-bé', language: 'dioula' },
];

export function applyPhoneticRules(text: string): string {
  let processedText = text;

  PHONETIC_DICTIONARY.forEach(rule => {
    const regex = new RegExp(`\\b${rule.word}\\b`, 'gi');
    processedText = processedText.replace(regex, rule.phonetic);
  });

  return processedText;
}
