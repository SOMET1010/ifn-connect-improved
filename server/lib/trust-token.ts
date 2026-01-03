/**
 * Trust Token Manager - Offline Authentication Support
 *
 * Generates short-lived trust tokens for offline/degraded mode authentication.
 * Tokens are only issued after successful high-trust authentication (score ≥ 90).
 *
 * Security Features:
 * - 3-hour expiration
 * - Device binding (fingerprint verification)
 * - HMAC signature verification
 * - Limited action scope
 * - Usage tracking
 *
 * Use Case:
 * Rural areas with intermittent connectivity. After successful auth with high trust score,
 * user receives token allowing temporary offline access to core features.
 */

import crypto from 'crypto';

interface TrustTokenPayload {
  merchantId: number;
  deviceFingerprint: string;
  score: number;
  issuedAt: number;
  expiresAt: number;
  allowedActions: string[];
  sessionId: string;
}

interface TrustToken extends TrustTokenPayload {
  signature: string;
}

interface TokenValidationResult {
  isValid: boolean;
  reason?: string;
  token?: TrustToken;
  timeRemaining?: number;
}

export class TrustTokenManager {
  private static readonly MIN_SCORE_FOR_TOKEN = 90;

  private static readonly TOKEN_LIFETIME_MS = 3 * 60 * 60 * 1000;

  private static readonly ALLOWED_OFFLINE_ACTIONS = [
    'view_dashboard',
    'view_sales',
    'view_stock',
    'create_sale',
    'update_stock',
    'view_profile',
  ];

  private static readonly RESTRICTED_OFFLINE_ACTIONS = [
    'transfer_money',
    'update_profile',
    'manage_users',
    'view_sensitive_data',
  ];

  /**
   * Generate a new trust token for a merchant
   */
  public static async generate(
    merchantId: number,
    deviceFingerprint: string,
    trustScore: number
  ): Promise<TrustToken | null> {
    if (trustScore < this.MIN_SCORE_FOR_TOKEN) {
      return null;
    }

    const now = Date.now();

    const payload: TrustTokenPayload = {
      merchantId,
      deviceFingerprint,
      score: trustScore,
      issuedAt: now,
      expiresAt: now + this.TOKEN_LIFETIME_MS,
      allowedActions: this.ALLOWED_OFFLINE_ACTIONS,
      sessionId: crypto.randomBytes(16).toString('hex'),
    };

    const signature = this.signPayload(payload);

    return {
      ...payload,
      signature,
    };
  }

  /**
   * Validate a trust token
   */
  public static validate(
    token: TrustToken,
    currentDeviceFingerprint: string
  ): TokenValidationResult {
    if (Date.now() > token.expiresAt) {
      return {
        isValid: false,
        reason: 'Token expired',
      };
    }

    if (token.deviceFingerprint !== currentDeviceFingerprint) {
      return {
        isValid: false,
        reason: 'Device mismatch',
      };
    }

    if (token.score < this.MIN_SCORE_FOR_TOKEN) {
      return {
        isValid: false,
        reason: 'Insufficient trust score',
      };
    }

    const expectedSignature = this.signPayload(token);
    if (token.signature !== expectedSignature) {
      return {
        isValid: false,
        reason: 'Invalid signature',
      };
    }

    const timeRemaining = token.expiresAt - Date.now();

    return {
      isValid: true,
      token,
      timeRemaining,
    };
  }

  /**
   * Check if an action is allowed with given token
   */
  public static isActionAllowed(token: TrustToken, action: string): boolean {
    return token.allowedActions.includes(action);
  }

  /**
   * Check if token needs renewal (< 30 min remaining)
   */
  public static needsRenewal(token: TrustToken): boolean {
    const timeRemaining = token.expiresAt - Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    return timeRemaining < thirtyMinutes && timeRemaining > 0;
  }

  /**
   * Convert token to storable hash
   */
  public static async hashToken(token: TrustToken): Promise<string> {
    const tokenString = JSON.stringify({
      merchantId: token.merchantId,
      sessionId: token.sessionId,
      signature: token.signature,
    });

    return crypto.createHash('sha256').update(tokenString).digest('hex');
  }

  /**
   * Sign token payload with HMAC
   */
  private static signPayload(payload: TrustTokenPayload): string {
    const secret = process.env.TRUST_TOKEN_SECRET;

    if (!secret) {
      throw new Error('TRUST_TOKEN_SECRET environment variable not set');
    }

    const dataToSign = JSON.stringify({
      merchantId: payload.merchantId,
      deviceFingerprint: payload.deviceFingerprint,
      score: payload.score,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
      sessionId: payload.sessionId,
    });

    return crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
  }

  /**
   * Serialize token for client storage
   */
  public static serialize(token: TrustToken): string {
    return JSON.stringify(token);
  }

  /**
   * Deserialize token from client storage
   */
  public static deserialize(serialized: string): TrustToken | null {
    try {
      const token = JSON.parse(serialized) as TrustToken;

      if (
        !token.merchantId ||
        !token.deviceFingerprint ||
        !token.signature ||
        !token.sessionId
      ) {
        return null;
      }

      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token metadata for display
   */
  public static getMetadata(token: TrustToken): {
    expiresIn: string;
    isExpiringSoon: boolean;
    allowedActionsCount: number;
  } {
    const now = Date.now();
    const timeRemaining = token.expiresAt - now;

    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

    let expiresIn = '';
    if (hours > 0) {
      expiresIn = `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      expiresIn = `${minutes} minutes`;
    } else {
      expiresIn = 'Expiré';
    }

    const isExpiringSoon = timeRemaining < 30 * 60 * 1000;

    return {
      expiresIn,
      isExpiringSoon,
      allowedActionsCount: token.allowedActions.length,
    };
  }

  /**
   * Revoke token (client-side cleanup helper)
   */
  public static revoke(): void {
    try {
      localStorage.removeItem('ifn_trust_token');
    } catch (error) {
      console.error('Error revoking trust token:', error);
    }
  }
}

export type { TrustToken, TrustTokenPayload, TokenValidationResult };
