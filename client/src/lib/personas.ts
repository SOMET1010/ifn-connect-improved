export type Persona = 'tantie' | 'jeune' | 'neutral';

export interface PersonaMessages {
  greeting: string;
  farewell: string;
  confirm: string;
  cancel: string;
  wait: string;
  error: string;
  success: string;
}

export const PERSONA_STYLES: Record<Persona, PersonaMessages> = {
  tantie: {
    greeting: 'Bonjour ma fille',
    farewell: 'À bientôt ma fille, que Dieu te protège',
    confirm: 'Oui, c\'est bon',
    cancel: 'Non, laisse ça',
    wait: 'Patiente doucement ma fille',
    error: 'Y\'a un petit problème là',
    success: 'C\'est bon ma fille!',
  },
  jeune: {
    greeting: 'Walaï mon vieux',
    farewell: 'À tantôt, gère bien',
    confirm: 'C\'est validé',
    cancel: 'Laisse tomber',
    wait: 'Patiente petit',
    error: 'Y\'a drap là',
    success: 'On est ensemble!',
  },
  neutral: {
    greeting: 'Bonjour',
    farewell: 'Au revoir',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    wait: 'Patientez...',
    error: 'Erreur',
    success: 'Succès',
  },
};

export function detectPersonaFromPhone(phone: string): Persona {
  const lastDigit = parseInt(phone.slice(-1));
  if (lastDigit % 2 === 0) {
    return 'tantie';
  }
  return 'jeune';
}

export function detectPersonaFromAge(age?: number): Persona {
  if (!age) return 'neutral';
  if (age >= 45) return 'tantie';
  if (age <= 35) return 'jeune';
  return 'neutral';
}

export function getPersonaStyle(persona: Persona): PersonaMessages {
  return PERSONA_STYLES[persona];
}
