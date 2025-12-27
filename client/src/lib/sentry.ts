import * as Sentry from "@sentry/react";
import { onCLS, onLCP, onFCP, onTTFB, onINP, Metric } from "web-vitals";

/**
 * Configuration Sentry pour le monitoring d'erreurs et de performance
 * 
 * Note: Sentry est désactivé en développement par défaut.
 * Pour l'activer en production, définir VITE_SENTRY_DSN dans les variables d'environnement.
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;

export function initSentry() {
  // Ne pas initialiser Sentry si pas de DSN configuré
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN non configuré - monitoring désactivé');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PRODUCTION ? 'production' : 'development',
    
    // Intégrations
    integrations: [
      // Replay des sessions utilisateurs (utile pour debug)
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      
      // Monitoring des performances
      Sentry.browserTracingIntegration(),
      
      // Feedback utilisateur
      Sentry.feedbackIntegration({
        colorScheme: "system",
        showBranding: false,
      }),
    ],

    // Taux d'échantillonnage des traces de performance (10%)
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    
    // Taux d'échantillonnage des replays (10% des sessions)
    replaysSessionSampleRate: 0.1,
    
    // Capturer 100% des sessions avec erreurs
    replaysOnErrorSampleRate: 1.0,
    
    // Ignorer certaines erreurs communes non critiques
    ignoreErrors: [
      // Erreurs réseau
      'NetworkError',
      'Failed to fetch',
      'Network request failed',
      
      // Erreurs de navigation
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      
      // Erreurs d'extensions navigateur
      'Non-Error promise rejection captured',
    ],
    
    // Filtrer les URLs sensibles des breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Ne pas logger les URLs contenant des tokens ou mots de passe
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        if (breadcrumb.data?.url) {
          breadcrumb.data.url = breadcrumb.data.url.replace(/([?&])(token|password|api_key)=[^&]*/gi, '$1$2=***');
        }
      }
      return breadcrumb;
    },
    
    // Filtrer les données sensibles avant envoi
    beforeSend(event) {
      // Masquer les données sensibles dans les requêtes
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'string') {
          event.request.data = data.replace(/"(password|token|api_key)"\s*:\s*"[^"]*"/gi, '"$1":"***"');
        }
      }
      return event;
    },
  });

  console.log('[Sentry] Monitoring initialisé');
}

/**
 * Reporter Web Vitals vers Sentry
 * Permet de suivre les métriques de performance Core Web Vitals
 */
export function reportWebVitals() {
  if (!SENTRY_DSN) return;

  const sendToSentry = (metric: Metric) => {
    // Envoyer la métrique comme mesure personnalisée
    Sentry.setMeasurement(metric.name, metric.value, metric.rating);
    
    // Ajouter un breadcrumb pour le contexte
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
      level: metric.rating === 'good' ? 'info' : metric.rating === 'needs-improvement' ? 'warning' : 'error',
      data: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      },
    });
  };

  // Écouter toutes les métriques Core Web Vitals
  onCLS(sendToSentry);   // Cumulative Layout Shift
  onINP(sendToSentry);   // Interaction to Next Paint (remplace FID)
  onLCP(sendToSentry);   // Largest Contentful Paint
  onFCP(sendToSentry);   // First Contentful Paint
  onTTFB(sendToSentry);  // Time to First Byte
}

/**
 * Capturer une erreur manuellement
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (!SENTRY_DSN) {
    console.error('[Sentry] Error:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capturer un message d'information
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!SENTRY_DSN) {
    console.log(`[Sentry] ${level}:`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Définir le contexte utilisateur pour Sentry
 */
export function setUser(user: { id: number; email?: string; username?: string } | null) {
  if (!SENTRY_DSN) return;

  if (user) {
    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Ajouter un tag personnalisé
 */
export function setTag(key: string, value: string) {
  if (!SENTRY_DSN) return;
  Sentry.setTag(key, value);
}

/**
 * Ajouter du contexte supplémentaire
 */
export function setContext(name: string, context: Record<string, any>) {
  if (!SENTRY_DSN) return;
  Sentry.setContext(name, context);
}
