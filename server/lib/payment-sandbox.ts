/**
 * Simulateur Sandbox pour les paiements Mobile Money
 *
 * Ce module simule le comportement des APIs Mobile Money réelles
 * pour faciliter les tests et le développement sans vraies transactions.
 *
 * Fonctionnalités:
 * - Simulation de différents scénarios (succès, échec, timeout)
 * - Génération de références et IDs de transaction
 * - Simulation de webhooks asynchrones
 * - Simulation de latence réseau
 */

export type Provider = 'orange_money' | 'mtn_momo' | 'moov_money' | 'wave';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'timeout' | 'cancelled';

export interface PaymentRequest {
  amount: string;
  currency: string;
  provider: Provider;
  phoneNumber: string;
  reference: string;
  callbackUrl?: string;
}

export interface PaymentResponse {
  transactionId: string;
  reference: string;
  status: PaymentStatus;
  message: string;
  provider: Provider;
  timestamp: string;
}

export interface WebhookPayload {
  reference: string;
  status: PaymentStatus;
  transaction_id: string;
  amount: string;
  currency: string;
  provider: Provider;
  phone_number: string;
  timestamp: string;
  signature: string;
}

/**
 * Simulateur de paiement Mobile Money
 */
export class PaymentSandbox {
  /**
   * Détermine le scénario de simulation basé sur le numéro de téléphone
   *
   * Règles de simulation:
   * - Se termine par 00 → Succès immédiat
   * - Se termine par 11 → Succès après délai (3s)
   * - Se termine par 99 → Échec (solde insuffisant)
   * - Se termine par 98 → Échec (numéro invalide)
   * - Se termine par 97 → Échec (transaction refusée par l'utilisateur)
   * - Se termine par 96 → Timeout (pas de réponse)
   * - Se termine par 95 → Échec (service temporairement indisponible)
   * - Autres → Succès après délai (2s)
   */
  static determineScenario(phoneNumber: string): {
    status: PaymentStatus;
    delay: number;
    errorMessage?: string;
  } {
    const lastTwoDigits = phoneNumber.slice(-2);

    switch (lastTwoDigits) {
      case '00':
        return { status: 'success', delay: 500 }; // Succès immédiat

      case '11':
        return { status: 'success', delay: 3000 }; // Succès après délai

      case '99':
        return {
          status: 'failed',
          delay: 1500,
          errorMessage: 'Solde insuffisant sur le compte Mobile Money'
        };

      case '98':
        return {
          status: 'failed',
          delay: 1000,
          errorMessage: 'Numéro de téléphone invalide ou compte inexistant'
        };

      case '97':
        return {
          status: 'failed',
          delay: 2000,
          errorMessage: 'Transaction refusée par l\'utilisateur'
        };

      case '96':
        return {
          status: 'timeout',
          delay: 5000,
          errorMessage: 'Timeout: Aucune réponse de l\'utilisateur'
        };

      case '95':
        return {
          status: 'failed',
          delay: 1000,
          errorMessage: 'Service Mobile Money temporairement indisponible'
        };

      default:
        return { status: 'success', delay: 2000 }; // Succès normal
    }
  }

  /**
   * Génère un ID de transaction simulé
   */
  static generateTransactionId(provider: Provider): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const prefix = provider.toUpperCase().replace('_', '-');
    return `${prefix}-SIM-${timestamp}-${random}`;
  }

  /**
   * Génère une signature simulée pour le webhook
   * En production, cela devrait être un HMAC SHA256
   */
  static generateSignature(payload: Omit<WebhookPayload, 'signature'>, secret: string = 'sandbox_secret'): string {
    const data = JSON.stringify(payload);
    // Simulation simple - en production, utiliser crypto.createHmac
    return `sim_${Buffer.from(data + secret).toString('base64').slice(0, 32)}`;
  }

  /**
   * Simule une demande de paiement
   */
  static async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    const scenario = this.determineScenario(request.phoneNumber);
    const transactionId = this.generateTransactionId(request.provider);

    // Retourner immédiatement avec status pending
    const response: PaymentResponse = {
      transactionId,
      reference: request.reference,
      status: 'pending',
      message: 'Paiement initié. En attente de confirmation.',
      provider: request.provider,
      timestamp: new Date().toISOString(),
    };

    // Simuler le traitement asynchrone et webhook
    if (request.callbackUrl) {
      this.scheduleWebhook(request, transactionId, scenario, request.callbackUrl);
    }

    return response;
  }

  /**
   * Planifie l'envoi d'un webhook après le délai simulé
   */
  private static scheduleWebhook(
    request: PaymentRequest,
    transactionId: string,
    scenario: ReturnType<typeof PaymentSandbox.determineScenario>,
    callbackUrl: string
  ): void {
    setTimeout(async () => {
      const webhookPayload: Omit<WebhookPayload, 'signature'> = {
        reference: request.reference,
        status: scenario.status,
        transaction_id: transactionId,
        amount: request.amount,
        currency: request.currency,
        provider: request.provider,
        phone_number: request.phoneNumber,
        timestamp: new Date().toISOString(),
      };

      const signature = this.generateSignature(webhookPayload);
      const fullPayload: WebhookPayload = { ...webhookPayload, signature };

      try {
        // Envoyer le webhook
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Sandbox-Webhook': 'true',
            'X-Provider': request.provider,
          },
          body: JSON.stringify(fullPayload),
        });

        console.log(`[Sandbox] Webhook envoyé pour ${request.reference}: ${response.status}`);
      } catch (error) {
        console.error(`[Sandbox] Erreur d'envoi webhook pour ${request.reference}:`, error);
      }
    }, scenario.delay);
  }

  /**
   * Vérifie le statut d'un paiement (simulation)
   * Dans un vrai système, cela interrogerait l'API du provider
   */
  static async checkPaymentStatus(transactionId: string, phoneNumber?: string): Promise<{
    transactionId: string;
    status: PaymentStatus;
    message?: string;
  }> {
    // En mode sandbox, on simule que le statut est déterminé par le numéro de téléphone
    if (phoneNumber) {
      const scenario = this.determineScenario(phoneNumber);
      return {
        transactionId,
        status: scenario.status,
        message: scenario.errorMessage,
      };
    }

    // Si pas de numéro fourni, considérer comme succès par défaut
    return {
      transactionId,
      status: 'success',
    };
  }

  /**
   * Simule un remboursement
   */
  static async refundPayment(transactionId: string, reason?: string): Promise<{
    success: boolean;
    refundId: string;
    message: string;
  }> {
    const refundId = `REFUND-${Date.now()}`;

    return {
      success: true,
      refundId,
      message: `Remboursement initié avec succès. ID: ${refundId}`,
    };
  }

  /**
   * Vérifie si une signature de webhook est valide
   */
  static verifyWebhookSignature(payload: WebhookPayload, secret: string = 'sandbox_secret'): boolean {
    const { signature, ...data } = payload;
    const expectedSignature = this.generateSignature(data, secret);
    return signature === expectedSignature;
  }

  /**
   * Obtient les informations du provider
   */
  static getProviderInfo(provider: Provider): {
    name: string;
    shortCode: string;
    color: string;
    minAmount: number;
    maxAmount: number;
  } {
    const providers = {
      orange_money: {
        name: 'Orange Money',
        shortCode: 'OM',
        color: '#FF6600',
        minAmount: 100,
        maxAmount: 1000000,
      },
      mtn_momo: {
        name: 'MTN Mobile Money',
        shortCode: 'MTN',
        color: '#FFCC00',
        minAmount: 100,
        maxAmount: 1000000,
      },
      moov_money: {
        name: 'Moov Money',
        shortCode: 'MOOV',
        color: '#0066CC',
        minAmount: 100,
        maxAmount: 500000,
      },
      wave: {
        name: 'Wave',
        shortCode: 'WAVE',
        color: '#FF006E',
        minAmount: 50,
        maxAmount: 2000000,
      },
    };

    return providers[provider];
  }

  /**
   * Valide un montant pour un provider donné
   */
  static validateAmount(amount: number, provider: Provider): {
    valid: boolean;
    error?: string;
  } {
    const providerInfo = this.getProviderInfo(provider);

    if (amount < providerInfo.minAmount) {
      return {
        valid: false,
        error: `Le montant minimum pour ${providerInfo.name} est de ${providerInfo.minAmount} FCFA`,
      };
    }

    if (amount > providerInfo.maxAmount) {
      return {
        valid: false,
        error: `Le montant maximum pour ${providerInfo.name} est de ${providerInfo.maxAmount} FCFA`,
      };
    }

    return { valid: true };
  }

  /**
   * Valide un numéro de téléphone ivoirien
   */
  static validatePhoneNumber(phoneNumber: string): {
    valid: boolean;
    formatted?: string;
    error?: string;
  } {
    // Supprimer les espaces et caractères spéciaux
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Formats acceptés:
    // - +225XXXXXXXXXX (13 caractères)
    // - 225XXXXXXXXXX (12 caractères)
    // - 0XXXXXXXXX (10 caractères)
    // - XXXXXXXXXX (10 caractères sans le 0)

    const patterns = [
      /^\+225([0-9]{10})$/, // +225XXXXXXXXXX
      /^225([0-9]{10})$/,   // 225XXXXXXXXXX
      /^0([0-9]{9})$/,      // 0XXXXXXXXX
      /^([0-9]{10})$/,      // XXXXXXXXXX
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const digits = match[1] || cleaned;
        const formatted = `+225${digits.startsWith('0') ? digits.slice(1) : digits}`;
        return { valid: true, formatted };
      }
    }

    return {
      valid: false,
      error: 'Format de numéro invalide. Formats acceptés: +225XXXXXXXXXX, 0XXXXXXXXX',
    };
  }
}
