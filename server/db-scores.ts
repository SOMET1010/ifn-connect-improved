import { getDb } from './db';
import { merchantScores, scoreHistory, sales, merchants, savingsTransactions } from '../drizzle/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

/**
 * Algorithme de calcul du Score SUTA
 * Score total sur 100 points basé sur 5 critères
 */

/**
 * 1. Régularité des ventes (30 points max)
 * Mesure la constance dans l'enregistrement des ventes
 */
async function calculateRegularityScore(merchantId: number): Promise<{ score: number; consecutiveDays: number }> {
  const db = await getDb();
  if (!db) return { score: 0, consecutiveDays: 0 };

  // Compter les jours consécutifs avec au moins une vente
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const salesData = await db
    .select({
      saleDate: sql<string>`DATE(${sales.createdAt})`,
    })
    .from(sales)
    .where(and(
      eq(sales.merchantId, merchantId),
      gte(sales.createdAt, last30Days)
    ))
    .groupBy(sql`DATE(${sales.createdAt})`)
    .orderBy(desc(sql`DATE(${sales.createdAt})`));

  if (salesData.length === 0) return { score: 0, consecutiveDays: 0 };

  // Calculer la séquence consécutive la plus longue
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  
  for (let i = 1; i < salesData.length; i++) {
    const prevDate = new Date(salesData[i - 1].saleDate);
    const currDate = new Date(salesData[i].saleDate);
    const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }

  // Score: 30 jours consécutifs = 30 points
  const score = Math.min(30, maxConsecutive);
  
  return { score, consecutiveDays: maxConsecutive };
}

/**
 * 2. Volume de transactions (20 points max)
 * Mesure le montant total des ventes
 */
async function calculateVolumeScore(merchantId: number): Promise<{ score: number; totalAmount: number }> {
  const db = await getDb();
  if (!db) return { score: 0, totalAmount: 0 };

  // Calculer le total des ventes sur les 30 derniers jours
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const result = await db
    .select({
      totalAmount: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    })
    .from(sales)
    .where(and(
      eq(sales.merchantId, merchantId),
      gte(sales.createdAt, last30Days)
    ));

  const totalAmount = result[0]?.totalAmount || 0;

  // Score: 1 000 000 FCFA = 20 points (échelle linéaire)
  const score = Math.min(20, Math.floor((totalAmount / 1000000) * 20));
  
  return { score, totalAmount };
}

/**
 * 3. Épargne régulière (20 points max)
 * Mesure la capacité à épargner
 */
async function calculateSavingsScore(merchantId: number): Promise<{ score: number; totalSavings: number }> {
  const db = await getDb();
  if (!db) return { score: 0, totalSavings: 0 };

  // Calculer le total épargné
  const result = await db
    .select({
      totalSavings: sql<number>`COALESCE(SUM(CASE WHEN ${savingsTransactions.type} = 'deposit' THEN ${savingsTransactions.amount} ELSE -${savingsTransactions.amount} END), 0)`,
    })
    .from(savingsTransactions)
    .where(eq(savingsTransactions.merchantId, merchantId));

  const totalSavings = result[0]?.totalSavings || 0;

  // Score: 100 000 FCFA épargné = 20 points
  const score = Math.min(20, Math.floor((totalSavings / 100000) * 20));
  
  return { score, totalSavings };
}

/**
 * 4. Utilisation de l'app (15 points max)
 * Mesure l'engagement avec la plateforme
 */
async function calculateUsageScore(merchantId: number): Promise<{ score: number; usageDays: number }> {
  const db = await getDb();
  if (!db) return { score: 0, usageDays: 0 };

  // Compter le nombre de jours distincts avec activité (ventes)
  const result = await db
    .select({
      usageDays: sql<number>`COUNT(DISTINCT DATE(${sales.createdAt}))`,
    })
    .from(sales)
    .where(eq(sales.merchantId, merchantId));

  const usageDays = result[0]?.usageDays || 0;

  // Score: 30 jours d'utilisation = 15 points
  const score = Math.min(15, Math.floor((usageDays / 30) * 15));
  
  return { score, usageDays };
}

/**
 * 5. Ancienneté (15 points max)
 * Mesure la durée depuis l'inscription
 */
async function calculateSeniorityScore(merchantId: number): Promise<{ score: number; accountAgeDays: number }> {
  const db = await getDb();
  if (!db) return { score: 0, accountAgeDays: 0 };

  const merchant = await db
    .select({ createdAt: merchants.createdAt })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant[0]) return { score: 0, accountAgeDays: 0 };

  const accountAgeDays = Math.floor(
    (Date.now() - merchant[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Score: 90 jours d'ancienneté = 15 points
  const score = Math.min(15, Math.floor((accountAgeDays / 90) * 15));
  
  return { score, accountAgeDays };
}

/**
 * Déterminer le tier de crédit basé sur le score
 */
function determineCreditTier(totalScore: number): 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (totalScore >= 80) return 'platinum'; // 80-100
  if (totalScore >= 65) return 'gold';      // 65-79
  if (totalScore >= 50) return 'silver';    // 50-64
  if (totalScore >= 35) return 'bronze';    // 35-49
  return 'none';                            // 0-34
}

/**
 * Calculer le montant maximum de crédit
 */
function calculateMaxCreditAmount(totalScore: number, totalSalesAmount: number): number {
  const tier = determineCreditTier(totalScore);
  
  // Montant de base selon le tier
  const baseAmounts: Record<typeof tier, number> = {
    'none': 0,
    'bronze': 50000,    // 50 000 FCFA
    'silver': 100000,   // 100 000 FCFA
    'gold': 200000,     // 200 000 FCFA
    'platinum': 500000, // 500 000 FCFA
  };

  const baseAmount = baseAmounts[tier];
  
  // Ajuster selon le volume de ventes (max 2x le montant de base)
  const salesMultiplier = Math.min(2, totalSalesAmount / 500000);
  
  return Math.floor(baseAmount * salesMultiplier);
}

/**
 * Calculer le score complet pour un marchand
 */
export async function calculateMerchantScore(merchantId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Calculer chaque composante
  const regularity = await calculateRegularityScore(merchantId);
  const volume = await calculateVolumeScore(merchantId);
  const savings = await calculateSavingsScore(merchantId);
  const usage = await calculateUsageScore(merchantId);
  const seniority = await calculateSeniorityScore(merchantId);

  // Score total
  const totalScore = regularity.score + volume.score + savings.score + usage.score + seniority.score;

  // Éligibilité crédit
  const isEligibleForCredit = totalScore >= 35; // Minimum bronze
  const creditTier = determineCreditTier(totalScore);
  const maxCreditAmount = calculateMaxCreditAmount(totalScore, volume.totalAmount);

  // Vérifier si un score existe déjà
  const existingScore = await db
    .select()
    .from(merchantScores)
    .where(eq(merchantScores.merchantId, merchantId))
    .limit(1);

  const scoreData = {
    merchantId,
    totalScore,
    regularityScore: regularity.score,
    volumeScore: volume.score,
    savingsScore: savings.score,
    usageScore: usage.score,
    seniorityScore: seniority.score,
    consecutiveSalesDays: regularity.consecutiveDays,
    totalSalesAmount: volume.totalAmount.toString(),
    totalSavingsAmount: savings.totalSavings.toString(),
    appUsageDays: usage.usageDays,
    accountAgeDays: seniority.accountAgeDays,
    isEligibleForCredit,
    maxCreditAmount: maxCreditAmount.toString(),
    creditTier,
    lastCalculatedAt: new Date(),
  };

  if (existingScore.length > 0) {
    // Mettre à jour le score existant
    await db
      .update(merchantScores)
      .set(scoreData)
      .where(eq(merchantScores.merchantId, merchantId));
  } else {
    // Créer un nouveau score
    await db.insert(merchantScores).values(scoreData);
  }

  // Ajouter à l'historique
  await db.insert(scoreHistory).values({
    merchantId,
    totalScore,
    creditTier,
  });

  return scoreData;
}

/**
 * Récupérer le score d'un marchand
 */
export async function getMerchantScore(merchantId: number) {
  const db = await getDb();
  if (!db) return null;

  const score = await db
    .select()
    .from(merchantScores)
    .where(eq(merchantScores.merchantId, merchantId))
    .limit(1);

  return score[0] || null;
}

/**
 * Récupérer l'historique des scores
 */
export async function getScoreHistory(merchantId: number, limit: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const history = await db
    .select()
    .from(scoreHistory)
    .where(eq(scoreHistory.merchantId, merchantId))
    .orderBy(desc(scoreHistory.createdAt))
    .limit(limit);

  return history;
}
