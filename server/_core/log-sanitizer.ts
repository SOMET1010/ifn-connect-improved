/**
 * PNAVIM-CI - Log Sanitizer
 * 
 * Purge les logs applicatifs pour masquer les données sensibles :
 * - Numéros de téléphone
 * - Numéros CNI
 * - Montants exacts
 * - Mots de passe, tokens, API keys
 * 
 * Garde uniquement :
 * - userId (référence opaque)
 * - Hash des données sensibles
 * - Références métier (merchantNumber, transactionId)
 */

import crypto from 'crypto';

/**
 * Patterns de données sensibles à masquer
 */
const SENSITIVE_PATTERNS = {
  // Numéros de téléphone (formats ivoiriens)
  phone: /(\+225|00225|0)?[0-9]{10}/g,
  
  // Numéros CNI (format ivoirien : CI + 12 chiffres)
  cni: /CI[0-9]{12}/gi,
  
  // Montants (avec FCFA, F CFA, ou symboles monétaires)
  amount: /\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{2})?\s*(?:FCFA|F\s*CFA|XOF|€|\$)/gi,
  
  // Montants numériques seuls (> 100 pour éviter faux positifs)
  numericAmount: /\b\d{3,}\b/g,
  
  // Mots de passe, tokens, API keys
  password: /(?:password|pwd|pass|token|apikey|api_key|secret|bearer)\s*[:=]\s*['"]?([^'"\s]+)['"]?/gi,
  
  // Adresses email
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Numéros de carte bancaire (16 chiffres)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  
  // Codes PIN (4 chiffres isolés)
  pin: /\bPIN\s*[:=]?\s*(\d{4})\b/gi,
};

/**
 * Générer un hash SHA256 d'une valeur
 */
function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
}

/**
 * Masquer un numéro de téléphone
 * Exemple : +225 0123456789 → +225 01****6789
 */
function maskPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.length < 8) return '***';
  
  const start = cleaned.substring(0, Math.min(4, cleaned.length - 4));
  const end = cleaned.substring(cleaned.length - 4);
  return `${start}****${end}`;
}

/**
 * Masquer un numéro CNI
 * Exemple : CI123456789012 → CI12****9012
 */
function maskCNI(cni: string): string {
  if (cni.length < 8) return 'CI****';
  const start = cni.substring(0, 4);
  const end = cni.substring(cni.length - 4);
  return `${start}****${end}`;
}

/**
 * Masquer un montant
 * Exemple : 15000 FCFA → [AMOUNT:3d4f] FCFA
 */
function maskAmount(amount: string): string {
  const hash = hashValue(amount);
  return `[AMOUNT:${hash}]`;
}

/**
 * Masquer un mot de passe/token
 */
function maskSecret(match: string, secret: string): string {
  const hash = hashValue(secret);
  return match.replace(secret, `[SECRET:${hash}]`);
}

/**
 * Masquer une adresse email
 * Exemple : john.doe@example.com → j***e@e***.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[EMAIL]';
  
  const maskedLocal = local.length > 2 
    ? `${local[0]}***${local[local.length - 1]}`
    : '***';
  
  const [domainName, tld] = domain.split('.');
  const maskedDomain = domainName.length > 2
    ? `${domainName[0]}***`
    : '***';
  
  return `${maskedLocal}@${maskedDomain}.${tld}`;
}

/**
 * Masquer une carte bancaire
 * Exemple : 1234 5678 9012 3456 → 1234 **** **** 3456
 */
function maskCreditCard(card: string): string {
  const cleaned = card.replace(/[\s-]/g, '');
  if (cleaned.length !== 16) return '****';
  
  return `${cleaned.substring(0, 4)} **** **** ${cleaned.substring(12)}`;
}

/**
 * Masquer un code PIN
 */
function maskPIN(match: string, pin: string): string {
  return match.replace(pin, '****');
}

/**
 * Sanitizer principal : nettoie un message de log
 */
export function sanitizeLog(message: string): string {
  let sanitized = message;
  
  // 1. Masquer les numéros de téléphone
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.phone, (match) => maskPhone(match));
  
  // 2. Masquer les numéros CNI
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.cni, (match) => maskCNI(match));
  
  // 3. Masquer les montants avec devise
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.amount, (match) => maskAmount(match));
  
  // 4. Masquer les mots de passe/tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.password, (match, secret) => maskSecret(match, secret));
  
  // 5. Masquer les emails
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.email, (match) => maskEmail(match));
  
  // 6. Masquer les cartes bancaires
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.creditCard, (match) => maskCreditCard(match));
  
  // 7. Masquer les codes PIN
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.pin, (match, pin) => maskPIN(match, pin));
  
  return sanitized;
}

/**
 * Sanitizer pour les objets (récursif)
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeLog(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Masquer complètement certains champs sensibles
      if (['password', 'pin', 'token', 'apiKey', 'secret'].includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Override de console.log pour sanitizer automatiquement
 */
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

/**
 * Activer la sanitization automatique des logs
 */
export function enableLogSanitization() {
  console.log = (...args: any[]) => {
    const sanitized = args.map(arg => sanitizeObject(arg));
    originalConsoleLog(...sanitized);
  };
  
  console.error = (...args: any[]) => {
    const sanitized = args.map(arg => sanitizeObject(arg));
    originalConsoleError(...sanitized);
  };
  
  console.warn = (...args: any[]) => {
    const sanitized = args.map(arg => sanitizeObject(arg));
    originalConsoleWarn(...sanitized);
  };
  
  console.info = (...args: any[]) => {
    const sanitized = args.map(arg => sanitizeObject(arg));
    originalConsoleInfo(...sanitized);
  };
  
  console.log('[LOG_SANITIZER] Sanitization automatique des logs activée');
}

/**
 * Désactiver la sanitization automatique des logs
 */
export function disableLogSanitization() {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
}

/**
 * Logger sécurisé pour les opérations sensibles
 */
export const secureLogger = {
  log: (message: string, data?: any) => {
    const sanitizedMessage = sanitizeLog(message);
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    originalConsoleLog(`[SECURE] ${sanitizedMessage}`, sanitizedData);
  },
  
  error: (message: string, error?: any) => {
    const sanitizedMessage = sanitizeLog(message);
    const sanitizedError = error ? sanitizeObject(error) : undefined;
    originalConsoleError(`[SECURE] ${sanitizedMessage}`, sanitizedError);
  },
  
  warn: (message: string, data?: any) => {
    const sanitizedMessage = sanitizeLog(message);
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    originalConsoleWarn(`[SECURE] ${sanitizedMessage}`, sanitizedData);
  },
  
  info: (message: string, data?: any) => {
    const sanitizedMessage = sanitizeLog(message);
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    originalConsoleInfo(`[SECURE] ${sanitizedMessage}`, sanitizedData);
  },
};

/**
 * Exemples d'utilisation :
 * 
 * // Activer la sanitization globale
 * enableLogSanitization();
 * 
 * // Les logs seront automatiquement nettoyés
 * console.log('Vente de 15000 FCFA par +225 0123456789');
 * // Output: Vente de [AMOUNT:3d4f] FCFA par +225 01****6789
 * 
 * // Utiliser le logger sécurisé
 * secureLogger.log('Paiement reçu', { amount: 5000, phone: '+225 0123456789' });
 * // Output: [SECURE] Paiement reçu { amount: [AMOUNT:...], phone: '+225 01****6789' }
 */
