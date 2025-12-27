/**
 * PNAVIM-CI - Rate Limiting Middleware
 * 
 * Protection contre les abus et attaques par force brute.
 * 
 * Règles implémentées :
 * - 100 requêtes / 15 minutes / IP (global)
 * - 10 requêtes / 15 minutes / IP (authentification)
 * - 5 requêtes / 15 minutes / IP (OTP)
 * - 20 requêtes / 15 minutes / IP (paiements)
 * - 10 requêtes / 15 minutes / IP (exports)
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Rate limiter global pour toutes les requêtes API
 * 100 requêtes par 15 minutes par IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par fenêtre
  message: {
    error: 'Trop de requêtes depuis cette adresse IP. Veuillez réessayer dans 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Retourne les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  
  // Utilise l'IP du client (supporte IPv4 et IPv6)
  // express-rate-limit gère automatiquement l'extraction de l'IP
  // Pas besoin de keyGenerator personnalisé
  
  // Handler personnalisé pour les erreurs de rate limit
  handler: (req: Request, res: Response) => {
    console.warn(`[RATE_LIMIT] IP ${req.ip} a dépassé la limite globale`);
    res.status(429).json({
      error: 'Trop de requêtes depuis cette adresse IP. Veuillez réessayer dans 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60, // secondes
    });
  },
  
  // Skip rate limit pour les IPs de confiance (admin, monitoring)
  skip: (req: Request): boolean => {
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    const clientIP = req.ip || '';
    return trustedIPs.includes(clientIP);
  },
});

/**
 * Rate limiter strict pour l'authentification
 * 10 requêtes par 15 minutes par IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  skipSuccessfulRequests: true, // Ne compte que les échecs
  handler: (req: Request, res: Response) => {
    console.warn(`[RATE_LIMIT] IP ${req.ip} a dépassé la limite d'authentification`);
    res.status(429).json({
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60,
    });
  },
});

/**
 * Rate limiter très strict pour les OTP
 * 5 requêtes par 15 minutes par IP
 */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Trop de demandes de code OTP. Veuillez réessayer dans 15 minutes.',
    code: 'OTP_RATE_LIMIT_EXCEEDED',
  },
  handler: (req: Request, res: Response) => {
    console.warn(`[RATE_LIMIT] IP ${req.ip} a dépassé la limite OTP`);
    res.status(429).json({
      error: 'Trop de demandes de code OTP. Veuillez réessayer dans 15 minutes.',
      code: 'OTP_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60,
    });
  },
});

/**
 * Rate limiter pour les paiements Mobile Money
 * 20 requêtes par 15 minutes par IP
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Trop de tentatives de paiement. Veuillez réessayer dans 15 minutes.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
  },
  handler: (req: Request, res: Response) => {
    console.warn(`[RATE_LIMIT] IP ${req.ip} a dépassé la limite de paiements`);
    res.status(429).json({
      error: 'Trop de tentatives de paiement. Veuillez réessayer dans 15 minutes.',
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60,
    });
  },
});

/**
 * Rate limiter pour les exports (Excel, PDF)
 * 10 requêtes par 15 minutes par IP
 */
export const exportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Trop de demandes d\'export. Veuillez réessayer dans 15 minutes.',
    code: 'EXPORT_RATE_LIMIT_EXCEEDED',
  },
  handler: (req: Request, res: Response) => {
    console.warn(`[RATE_LIMIT] IP ${req.ip} a dépassé la limite d'exports`);
    res.status(429).json({
      error: 'Trop de demandes d\'export. Veuillez réessayer dans 15 minutes.',
      code: 'EXPORT_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60,
    });
  },
});

/**
 * Rate limiter pour les uploads de fichiers
 * 20 requêtes par 15 minutes par IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Trop d\'uploads de fichiers. Veuillez réessayer dans 15 minutes.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  handler: (req: Request, res: Response) => {
    console.warn(`[RATE_LIMIT] IP ${req.ip} a dépassé la limite d'uploads`);
    res.status(429).json({
      error: 'Trop d\'uploads de fichiers. Veuillez réessayer dans 15 minutes.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60,
    });
  },
});

/**
 * Configuration des rate limiters par route
 */
export const rateLimitConfig = {
  // Routes d'authentification
  '/api/auth/login': authRateLimiter,
  '/api/auth/verify-otp': otpRateLimiter,
  '/api/auth/send-otp': otpRateLimiter,
  '/api/auth/verify-pin': authRateLimiter,
  
  // Routes de paiement
  '/api/trpc/payment': paymentRateLimiter,
  '/api/trpc/cnps': paymentRateLimiter,
  '/api/trpc/cmu': paymentRateLimiter,
  '/api/trpc/savings': paymentRateLimiter,
  
  // Routes d'export
  '/api/trpc/admin.exportMerchants': exportRateLimiter,
  '/api/trpc/admin.exportSales': exportRateLimiter,
  '/api/trpc/admin.exportTransactions': exportRateLimiter,
  '/api/trpc/cooperative.exportReport': exportRateLimiter,
  
  // Routes d'upload
  '/api/upload': uploadRateLimiter,
  '/api/trpc/agent.uploadPhoto': uploadRateLimiter,
};

/**
 * Middleware pour appliquer le rate limiting global
 */
export function applyGlobalRateLimit(app: any) {
  // Appliquer le rate limiter global à toutes les routes API
  app.use('/api', globalRateLimiter);
  
  console.log('[RATE_LIMIT] Rate limiting global activé (100 req/15min/IP)');
}

/**
 * Middleware pour appliquer les rate limiters spécifiques
 */
export function applySpecificRateLimits(app: any) {
  // Appliquer les rate limiters spécifiques par route
  Object.entries(rateLimitConfig).forEach(([route, limiter]) => {
    app.use(route, limiter);
  });
  
  console.log('[RATE_LIMIT] Rate limiters spécifiques activés');
  console.log('  - Auth: 10 req/15min/IP');
  console.log('  - OTP: 5 req/15min/IP');
  console.log('  - Paiements: 20 req/15min/IP');
  console.log('  - Exports: 10 req/15min/IP');
  console.log('  - Uploads: 20 req/15min/IP');
}
