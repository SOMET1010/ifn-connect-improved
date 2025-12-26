/**
 * InTouch API Integration Helper
 * 
 * Documentation: https://developers.intouchgroup.net/
 * 
 * InTouch est une plateforme de paiement pan-africaine qui permet de collecter
 * des paiements via Mobile Money (Orange Money, MTN, Moov, Wave) dans 27 pays africains.
 * 
 * Deux endpoints principaux :
 * 1. Transfer (Cash-In) : Dépôt vers un wallet - NON utilisé ici
 * 2. Direct Payment : Collecte depuis un wallet - Utilisé pour CNPS/CMU
 */

import { ENV } from './env';

// Types pour l'API InTouch
export interface InTouchPaymentRequest {
  partner_id: string;
  idFromClient: string; // ID unique de transaction
  additionnalInfos: {
    recipientEmail: string;
    recipientFirstName: string;
    recipientLastName: string;
    destinataire: string; // Numéro de téléphone
    otp: string; // Code OTP généré par le client
  };
  amount: string; // Montant en string
  callback: string; // URL de callback
  recipientNumber: string; // Numéro de téléphone
  serviceCode: string; // Code du service (ex: PAIEMENTMARCHANDOMPAYCIDIRECT)
}

export interface InTouchPaymentResponse {
  idFromClient: string;
  idFromGU: string; // ID InTouch
  amount: number;
  fees: number;
  serviceCode: string;
  status: 'SUCCESSFUL' | 'PENDING' | 'FAILED';
  message: string;
}

export interface InTouchCallbackPayload {
  idFromClient: string;
  idFromGU: string;
  status: 'SUCCESSFUL' | 'FAILED';
  message: string;
  amount: number;
  fees: number;
}

/**
 * Initier un paiement Mobile Money via InTouch Direct Payment API
 * 
 * @param params - Paramètres du paiement
 * @returns Réponse de l'API InTouch
 * 
 * @example
 * const result = await initierPaiementInTouch({
 *   phoneNumber: '0708123456',
 *   amount: 10000,
 *   otp: '1234',
 *   transactionId: 'CNPS-20250126-001',
 *   customerEmail: 'merchant@example.com',
 *   customerFirstName: 'Jean',
 *   customerLastName: 'Kouassi',
 * });
 */
export async function initierPaiementInTouch(params: {
  phoneNumber: string;
  amount: number;
  otp: string;
  transactionId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
}): Promise<InTouchPaymentResponse> {
  // Vérifier que les credentials sont configurés
  if (!ENV.INTOUCH_PARTNER_ID) {
    throw new Error('INTOUCH_PARTNER_ID non configuré');
  }
  if (!ENV.INTOUCH_LOGIN_API) {
    throw new Error('INTOUCH_LOGIN_API non configuré');
  }
  if (!ENV.INTOUCH_PASSWORD_API) {
    throw new Error('INTOUCH_PASSWORD_API non configuré - Veuillez le configurer');
  }
  if (!ENV.INTOUCH_USERNAME) {
    throw new Error('INTOUCH_USERNAME non configuré');
  }
  if (!ENV.INTOUCH_PASSWORD) {
    throw new Error('INTOUCH_PASSWORD non configuré');
  }

  // Construction de l'URL avec query params
  const url = new URL(
    `${ENV.INTOUCH_BASE_URL}/apidist/sec/touchpayapi/${ENV.INTOUCH_PARTNER_ID}/transaction`
  );
  url.searchParams.set('loginAgent', ENV.INTOUCH_LOGIN_API);
  url.searchParams.set('passwordAgent', ENV.INTOUCH_PASSWORD_API);

  // Construction du body de la requête
  const body: InTouchPaymentRequest = {
    partner_id: ENV.INTOUCH_PARTNER_ID,
    idFromClient: params.transactionId,
    additionnalInfos: {
      recipientEmail: params.customerEmail,
      recipientFirstName: params.customerFirstName,
      recipientLastName: params.customerLastName,
      destinataire: params.phoneNumber,
      otp: params.otp,
    },
    amount: params.amount.toString(),
    callback: `${ENV.forgeApiUrl || 'https://api.manus.im'}/intouch/callback`,
    recipientNumber: params.phoneNumber,
    serviceCode: ENV.INTOUCH_SERVICE_CODE,
  };

  // Construction du header Basic Auth
  const authString = `${ENV.INTOUCH_USERNAME}:${ENV.INTOUCH_PASSWORD}`;
  const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

  try {
    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Mapper les codes de statut HTTP aux statuts
    if (response.status === 200) {
      return {
        ...data,
        status: 'SUCCESSFUL',
      };
    } else if (response.status === 201) {
      return {
        ...data,
        status: 'PENDING',
      };
    } else if (response.status === 300) {
      return {
        ...data,
        status: 'FAILED',
        message: 'Code OTP incorrect',
      };
    } else if (response.status === 401) {
      throw new Error('Authentification InTouch échouée - Vérifiez vos credentials');
    } else {
      return {
        ...data,
        status: 'FAILED',
        message: data.message || 'Erreur lors du paiement',
      };
    }
  } catch (error) {
    console.error('[InTouch] Erreur lors de l\'appel API:', error);
    throw new Error('Erreur de connexion à InTouch - Veuillez réessayer');
  }
}

/**
 * Vérifier le statut d'une transaction InTouch
 * 
 * Note: L'endpoint Check Status n'est pas encore documenté dans la recherche.
 * Cette fonction est un placeholder pour future implémentation.
 * 
 * @param transactionId - ID de la transaction (idFromClient ou idFromGU)
 * @returns Statut de la transaction
 */
export async function verifierStatutTransactionInTouch(
  transactionId: string
): Promise<{ status: 'SUCCESSFUL' | 'PENDING' | 'FAILED'; message: string }> {
  // TODO: Implémenter avec l'endpoint Check Status de InTouch
  // Endpoint: POST https://apidist.gutouch.net/apidist/sec/checkstatus
  throw new Error('verifierStatutTransactionInTouch non implémenté - À compléter avec la doc InTouch');
}

/**
 * Valider et traiter un callback InTouch
 * 
 * Les callbacks InTouch sont envoyés après le traitement d'une transaction
 * pour notifier le résultat final (succès ou échec).
 * 
 * @param payload - Payload du callback reçu de InTouch
 * @returns Payload validé
 */
export function validerCallbackInTouch(payload: unknown): InTouchCallbackPayload {
  // Validation basique du payload
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de callback InTouch invalide');
  }

  const data = payload as Record<string, unknown>;

  if (!data.idFromClient || typeof data.idFromClient !== 'string') {
    throw new Error('idFromClient manquant dans le callback InTouch');
  }

  if (!data.status || (data.status !== 'SUCCESSFUL' && data.status !== 'FAILED')) {
    throw new Error('Statut invalide dans le callback InTouch');
  }

  return {
    idFromClient: data.idFromClient,
    idFromGU: (data.idFromGU as string) || '',
    status: data.status as 'SUCCESSFUL' | 'FAILED',
    message: (data.message as string) || '',
    amount: (data.amount as number) || 0,
    fees: (data.fees as number) || 0,
  };
}

/**
 * Générer un ID de transaction unique pour InTouch
 * 
 * Format: {PREFIX}-{TIMESTAMP}-{RANDOM}
 * Exemple: CNPS-20250126121530-A3F9
 * 
 * @param prefix - Préfixe (CNPS ou CMU)
 * @returns ID de transaction unique
 */
export function genererIdTransactionInTouch(prefix: 'CNPS' | 'CMU'): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14); // YYYYMMDDHHmmss
  
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}-${timestamp}-${random}`;
}
