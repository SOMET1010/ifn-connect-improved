import { getDb } from './db';
import { savingsGoals, savingsTransactions, InsertSavingsGoal, InsertSavingsTransaction } from '../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Créer un nouvel objectif d'épargne (cagnotte)
 */
export async function createSavingsGoal(data: InsertSavingsGoal) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(savingsGoals).values(data);
  return result;
}

/**
 * Récupérer les objectifs d'épargne d'un marchand
 */
export async function getMerchantSavingsGoals(merchantId: number) {
  const db = await getDb();
  if (!db) return [];

  const goals = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.merchantId, merchantId))
    .orderBy(desc(savingsGoals.createdAt));

  return goals;
}

/**
 * Récupérer un objectif d'épargne spécifique
 */
export async function getSavingsGoalById(goalId: number) {
  const db = await getDb();
  if (!db) return null;

  const goal = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.id, goalId))
    .limit(1);

  return goal[0] || null;
}

/**
 * Ajouter un dépôt à une cagnotte
 */
export async function addDeposit(data: {
  savingsGoalId: number;
  merchantId: number;
  amount: number;
  source?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Récupérer la cagnotte
  const goal = await getSavingsGoalById(data.savingsGoalId);
  if (!goal) throw new Error('Savings goal not found');

  // Ajouter la transaction
  await db.insert(savingsTransactions).values({
    savingsGoalId: data.savingsGoalId,
    merchantId: data.merchantId,
    amount: data.amount.toString(),
    type: 'deposit',
    source: data.source || 'manual',
    notes: data.notes,
  });

  // Mettre à jour le montant actuel de la cagnotte
  const newAmount = parseFloat(goal.currentAmount) + data.amount;
  await db
    .update(savingsGoals)
    .set({
      currentAmount: newAmount.toString(),
      isCompleted: newAmount >= parseFloat(goal.targetAmount),
      completedAt: newAmount >= parseFloat(goal.targetAmount) ? new Date() : null,
    })
    .where(eq(savingsGoals.id, data.savingsGoalId));

  return { success: true, newAmount };
}

/**
 * Retirer de l'épargne
 */
export async function withdraw(data: {
  savingsGoalId: number;
  merchantId: number;
  amount: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Récupérer la cagnotte
  const goal = await getSavingsGoalById(data.savingsGoalId);
  if (!goal) throw new Error('Savings goal not found');

  const currentAmount = parseFloat(goal.currentAmount);
  if (currentAmount < data.amount) {
    throw new Error('Insufficient funds');
  }

  // Ajouter la transaction de retrait
  await db.insert(savingsTransactions).values({
    savingsGoalId: data.savingsGoalId,
    merchantId: data.merchantId,
    amount: data.amount.toString(),
    type: 'withdrawal',
    notes: data.notes,
  });

  // Mettre à jour le montant actuel
  const newAmount = currentAmount - data.amount;
  await db
    .update(savingsGoals)
    .set({
      currentAmount: newAmount.toString(),
      isCompleted: false,
      completedAt: null,
    })
    .where(eq(savingsGoals.id, data.savingsGoalId));

  return { success: true, newAmount };
}

/**
 * Récupérer les transactions d'une cagnotte
 */
export async function getSavingsTransactions(savingsGoalId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const transactions = await db
    .select()
    .from(savingsTransactions)
    .where(eq(savingsTransactions.savingsGoalId, savingsGoalId))
    .orderBy(desc(savingsTransactions.createdAt))
    .limit(limit);

  return transactions;
}

/**
 * Récupérer toutes les transactions d'un marchand
 */
export async function getMerchantSavingsTransactions(merchantId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  const transactions = await db
    .select()
    .from(savingsTransactions)
    .where(eq(savingsTransactions.merchantId, merchantId))
    .orderBy(desc(savingsTransactions.createdAt))
    .limit(limit);

  return transactions;
}

/**
 * Calculer le total épargné par un marchand
 */
export async function getTotalSavings(merchantId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(CASE WHEN ${savingsTransactions.type} = 'deposit' THEN ${savingsTransactions.amount} ELSE -${savingsTransactions.amount} END), 0)`,
    })
    .from(savingsTransactions)
    .where(eq(savingsTransactions.merchantId, merchantId));

  return result[0]?.total || 0;
}

/**
 * Mettre à jour un objectif d'épargne
 */
export async function updateSavingsGoal(goalId: number, data: Partial<InsertSavingsGoal>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(savingsGoals)
    .set(data)
    .where(eq(savingsGoals.id, goalId));

  return { success: true };
}

/**
 * Supprimer un objectif d'épargne
 */
export async function deleteSavingsGoal(goalId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Supprimer les transactions associées (cascade)
  await db
    .delete(savingsGoals)
    .where(eq(savingsGoals.id, goalId));

  return { success: true };
}

/**
 * Obtenir les statistiques d'épargne d'un marchand
 */
export async function getSavingsStats(merchantId: number) {
  const db = await getDb();
  if (!db) return null;

  // Total épargné
  const totalSavings = await getTotalSavings(merchantId);

  // Nombre de cagnottes
  const goals = await getMerchantSavingsGoals(merchantId);
  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);

  // Montant total des objectifs
  const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0);
  const totalCurrent = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);

  // Progression globale
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return {
    totalSavings,
    totalGoals: goals.length,
    activeGoals: activeGoals.length,
    completedGoals: completedGoals.length,
    totalTarget,
    totalCurrent,
    overallProgress: Math.round(overallProgress),
  };
}
