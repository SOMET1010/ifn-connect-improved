import { getDb } from './db';
import { auditLogs } from '../drizzle/schema';

/**
 * Types d'actions audit
 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import';

/**
 * Types d'entités
 */
export type EntityType =
  | 'merchants'
  | 'users'
  | 'sales'
  | 'renewals'
  | 'badges'
  | 'markets'
  | 'cooperatives'
  | 'agents';

/**
 * Interface pour les changements
 */
export interface AuditChanges {
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Helper pour créer un log d'audit
 * 
 * @param userId - ID de l'utilisateur qui effectue l'action
 * @param action - Type d'action (create, update, delete, etc.)
 * @param entityType - Type d'entité concernée
 * @param entityId - ID de l'entité (optionnel)
 * @param changes - Changements effectués (avant/après)
 * @param ipAddress - Adresse IP de l'utilisateur (optionnel)
 * @param userAgent - User agent du navigateur (optionnel)
 */
export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  changes,
  ipAddress,
  userAgent,
}: {
  userId: number;
  action: AuditAction;
  entityType: EntityType;
  entityId?: number;
  changes?: AuditChanges;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Audit] Database connection failed');
      return;
    }

    await db.insert(auditLogs).values({
      userId: userId || null,
      action,
      entity: entityType,
      entityId: entityId || null,
      details: changes ? JSON.stringify(changes) : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    console.log(`[Audit] ${action} ${entityType}${entityId ? ` #${entityId}` : ''} by user #${userId}`);
  } catch (error) {
    console.error('[Audit] Failed to log action:', error);
    // Ne pas throw pour ne pas bloquer l'opération principale
  }
}

/**
 * Helper pour extraire l'IP depuis une requête Express
 */
export function getClientIp(req: any): string | undefined {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    undefined
  );
}

/**
 * Helper pour extraire le User Agent
 */
export function getUserAgent(req: any): string | undefined {
  return req.headers['user-agent'] || undefined;
}
