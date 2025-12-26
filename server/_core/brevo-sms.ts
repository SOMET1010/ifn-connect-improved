/**
 * Module d'envoi de SMS via Brevo (anciennement Sendinblue)
 * Utilisé pour l'envoi d'OTP lors de l'authentification multi-niveaux
 */

import { ENV } from './env';

/**
 * Génère un code OTP à 6 chiffres aléatoire
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Formate un numéro de téléphone ivoirien au format international
 * Exemples:
 * - "0708459837" → "+2250708459837"
 * - "708459837" → "+2250708459837"
 * - "+2250708459837" → "+2250708459837"
 */
export function formatPhoneNumber(phone: string): string {
  // Retirer tous les espaces et caractères non numériques sauf le +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si commence par +225, c'est déjà au bon format
  if (cleaned.startsWith('+225')) {
    return cleaned;
  }
  
  // Si commence par 225, ajouter le +
  if (cleaned.startsWith('225')) {
    return '+' + cleaned;
  }
  
  // Si commence par 0, retirer le 0 et ajouter +225
  if (cleaned.startsWith('0')) {
    return '+225' + cleaned.substring(1);
  }
  
  // Si le numéro fait 9 chiffres (sans le 0), ajouter +225
  if (cleaned.length === 9) {
    return '+225' + cleaned;
  }
  
  // Si le numéro fait 10 chiffres (avec le 0), retirer le 0 et ajouter +225
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return '+225' + cleaned.substring(1);
  }
  
  // Sinon, ajouter directement +225
  return '+225' + cleaned;
}

/**
 * Envoie un SMS OTP via l'API Brevo
 * @param phone Numéro de téléphone au format ivoirien (avec ou sans +225)
 * @param otpCode Code OTP à 6 chiffres
 * @returns Promise<boolean> true si envoi réussi, false sinon
 */
export async function sendOTPSMS(phone: string, otpCode: string): Promise<boolean> {
  try {
    const apiKey = ENV.brevoApiKey;
    
    if (!apiKey) {
      console.error('[Brevo SMS] BREVO_API_KEY non configurée');
      return false;
    }
    
    // Formater le numéro au format international
    const formattedPhone = formatPhoneNumber(phone);
    
    // Message SMS personnalisé
    const message = `Votre code de vérification IFN Connect est : ${otpCode}. Ce code expire dans 5 minutes. Ne le partagez avec personne.`;
    
    // Appel API Brevo Transactional SMS
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        type: 'transactional',
        sender: 'IFN Connect', // Nom de l'expéditeur (max 11 caractères)
        recipient: formattedPhone,
        content: message,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Brevo SMS] Erreur API:', response.status, errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('[Brevo SMS] SMS envoyé avec succès:', {
      messageId: data.messageId,
      recipient: formattedPhone,
      timestamp: new Date().toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('[Brevo SMS] Erreur lors de l\'envoi:', error);
    return false;
  }
}

/**
 * Envoie un SMS de notification générique via Brevo
 * @param phone Numéro de téléphone
 * @param message Contenu du message (max 160 caractères recommandé)
 * @returns Promise<boolean>
 */
export async function sendNotificationSMS(phone: string, message: string): Promise<boolean> {
  try {
    const apiKey = ENV.brevoApiKey;
    
    if (!apiKey) {
      console.error('[Brevo SMS] BREVO_API_KEY non configurée');
      return false;
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        type: 'transactional',
        sender: 'IFN Connect',
        recipient: formattedPhone,
        content: message,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Brevo SMS] Erreur API:', response.status, errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('[Brevo SMS] Notification envoyée:', {
      messageId: data.messageId,
      recipient: formattedPhone,
    });
    
    return true;
  } catch (error) {
    console.error('[Brevo SMS] Erreur lors de l\'envoi:', error);
    return false;
  }
}
