/**
 * Module de gestion du contexte Row Level Security (RLS)
 * Initialise le contexte de sécurité pour chaque requête authentifiée
 */

import { getDb } from '../db';

/**
 * Initialise le contexte de sécurité pour un utilisateur
 * À appeler au début de chaque requête authentifiée
 */
export async function initSecurityContext(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  try {
    // Appeler la procédure stockée pour initialiser le contexte
    await db.execute(`CALL INIT_SECURITY_CONTEXT(${userId})`);
  } catch (error) {
    console.error('[RLS] Failed to initialize security context:', error);
    throw new Error('Failed to initialize security context');
  }
}

/**
 * Vérifie si l'utilisateur courant est un admin
 */
export async function isAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Note: Cette fonction nécessite que les fonctions SQL RLS soient installées
    // Pour l'instant, on vérifie directement dans la table users
    const result: any = await db.execute(
      `SELECT role FROM users WHERE id = ${userId} LIMIT 1`
    );
    return result[0]?.[0]?.role === 'admin';
  } catch (error) {
    console.error('[RLS] Failed to check admin status:', error);
    return false;
  }
}

/**
 * Middleware tRPC pour initialiser le contexte RLS
 * À utiliser dans les procedures protégées
 */
export async function initRLSMiddleware(userId: number) {
  try {
    await initSecurityContext(userId);
    console.log(`[RLS] Security context initialized for user ${userId}`);
  } catch (error) {
    console.error(`[RLS] Failed to initialize context for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Wrapper pour exécuter une requête avec contexte RLS
 * Usage: await withRLS(userId, async () => { ... })
 */
export async function withRLS<T>(
  userId: number,
  callback: () => Promise<T>
): Promise<T> {
  await initSecurityContext(userId);
  return await callback();
}

/**
 * Noms des vues sécurisées à utiliser au lieu des tables directes
 */
export const SECURE_VIEWS = {
  sales: 'merchant_sales_view',
  products: 'merchant_products_view',
  documents: 'merchant_documents_view',
  cnps: 'merchant_cnps_view',
  cmu: 'merchant_cmu_view',
} as const;

/**
 * Helper pour obtenir le nom de la vue sécurisée
 */
export function getSecureView(tableName: keyof typeof SECURE_VIEWS): string {
  return SECURE_VIEWS[tableName];
}
