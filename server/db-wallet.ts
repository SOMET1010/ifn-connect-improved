import { getDb } from "./db";
import { wallets, walletTransactions, type InsertWallet, type InsertWalletTransaction } from "../drizzle/schema-wallet";
import { users } from "../drizzle/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Créer un wallet pour un utilisateur
 */
export async function createWallet(data: InsertWallet) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [wallet] = await db.insert(wallets).values(data).returning();
  return wallet;
}

/**
 * Obtenir le wallet d'un utilisateur par son userId
 */
export async function getWalletByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));

  return wallet || null;
}

/**
 * Obtenir le wallet d'un utilisateur par son merchantId
 */
export async function getWalletByMerchantId(merchantId: number) {
  const db = await getDb();
  if (!db) return null;

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.merchantId, merchantId));

  return wallet || null;
}

/**
 * Obtenir le solde du wallet
 */
export async function getWalletBalance(userId: number): Promise<string> {
  const wallet = await getWalletByUserId(userId);
  return wallet?.balance || "0";
}

/**
 * Générer une référence unique pour une transaction
 */
function generateTransactionReference(): string {
  return `TXN-${Date.now()}-${nanoid(8)}`.toUpperCase();
}

/**
 * Transférer de l'argent d'un wallet à un autre
 * Cette fonction gère la transaction atomique complète
 */
export async function transferMoney(params: {
  fromUserId: number;
  toUserId: number;
  amount: string;
  description?: string;
  notes?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { fromUserId, toUserId, amount, description, notes, metadata } = params;

  const amountNum = parseFloat(amount);
  if (amountNum <= 0) {
    throw new Error("Le montant doit être supérieur à 0");
  }

  return await db.transaction(async (tx) => {
    const fromWallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, fromUserId))
      .then(rows => rows[0]);

    if (!fromWallet) {
      throw new Error("Wallet émetteur introuvable");
    }

    const currentBalance = parseFloat(fromWallet.balance);
    if (currentBalance < amountNum) {
      throw new Error("Solde insuffisant");
    }

    const toWallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, toUserId))
      .then(rows => rows[0]);

    if (!toWallet) {
      throw new Error("Wallet destinataire introuvable");
    }

    const newFromBalance = (currentBalance - amountNum).toFixed(2);
    const newToBalance = (parseFloat(toWallet.balance) + amountNum).toFixed(2);

    await tx
      .update(wallets)
      .set({
        balance: newFromBalance,
        updatedAt: new Date()
      })
      .where(eq(wallets.id, fromWallet.id));

    await tx
      .update(wallets)
      .set({
        balance: newToBalance,
        updatedAt: new Date()
      })
      .where(eq(wallets.id, toWallet.id));

    const reference = generateTransactionReference();

    const [transaction] = await tx
      .insert(walletTransactions)
      .values({
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        fromUserId,
        toUserId,
        amount,
        currency: "XOF",
        type: "transfer_sent",
        status: "completed",
        reference,
        description: description || `Transfert vers ${toUserId}`,
        notes,
        metadata: metadata ? JSON.stringify(metadata) : null,
        completedAt: new Date(),
      })
      .returning();

    return transaction;
  });
}

/**
 * Créer une demande de paiement
 */
export async function createPaymentRequest(params: {
  fromUserId: number;
  toUserId: number;
  amount: string;
  description?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { fromUserId, toUserId, amount, description, notes } = params;

  const reference = generateTransactionReference();

  const [transaction] = await db
    .insert(walletTransactions)
    .values({
      fromUserId,
      toUserId,
      amount,
      currency: "XOF",
      type: "payment_request_sent",
      status: "pending",
      reference,
      description: description || `Demande de paiement`,
      notes,
    })
    .returning();

  return transaction;
}

/**
 * Accepter une demande de paiement
 */
export async function acceptPaymentRequest(transactionId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [transaction] = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, transactionId));

  if (!transaction) {
    throw new Error("Transaction introuvable");
  }

  if (transaction.status !== "pending") {
    throw new Error("Cette demande a déjà été traitée");
  }

  const result = await transferMoney({
    fromUserId: transaction.toUserId,
    toUserId: transaction.fromUserId,
    amount: transaction.amount,
    description: `Paiement de la demande ${transaction.reference}`,
    notes: transaction.notes || undefined,
  });

  await db
    .update(walletTransactions)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(walletTransactions.id, transactionId));

  return result;
}

/**
 * Annuler une demande de paiement
 */
export async function cancelPaymentRequest(transactionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [transaction] = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, transactionId));

  if (!transaction) {
    throw new Error("Transaction introuvable");
  }

  if (transaction.fromUserId !== userId && transaction.toUserId !== userId) {
    throw new Error("Non autorisé");
  }

  if (transaction.status !== "pending") {
    throw new Error("Cette demande ne peut plus être annulée");
  }

  const [updated] = await db
    .update(walletTransactions)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(walletTransactions.id, transactionId))
    .returning();

  return updated;
}

/**
 * Obtenir l'historique des transactions d'un utilisateur
 */
export async function getWalletTransactionHistory(
  userId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  const transactions = await db
    .select({
      id: walletTransactions.id,
      fromUserId: walletTransactions.fromUserId,
      toUserId: walletTransactions.toUserId,
      amount: walletTransactions.amount,
      currency: walletTransactions.currency,
      type: walletTransactions.type,
      status: walletTransactions.status,
      reference: walletTransactions.reference,
      description: walletTransactions.description,
      notes: walletTransactions.notes,
      completedAt: walletTransactions.completedAt,
      createdAt: walletTransactions.createdAt,
      fromUser: {
        id: sql<number>`from_user.id`,
        name: sql<string>`from_user.name`,
        phone: sql<string>`from_user.phone`,
      },
      toUser: {
        id: sql<number>`to_user.id`,
        name: sql<string>`to_user.name`,
        phone: sql<string>`to_user.phone`,
      },
    })
    .from(walletTransactions)
    .leftJoin(
      users,
      sql`${users.id} = ${walletTransactions.fromUserId}`
    )
    .leftJoin(
      sql`users as to_user`,
      sql`to_user.id = ${walletTransactions.toUserId}`
    )
    .where(
      or(
        eq(walletTransactions.fromUserId, userId),
        eq(walletTransactions.toUserId, userId)
      )
    )
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  return transactions;
}

/**
 * Obtenir les statistiques du wallet
 */
export async function getWalletStats(userId: number) {
  const db = await getDb();
  if (!db) return {
    balance: "0",
    totalSent: "0",
    totalReceived: "0",
    transactionCount: 0,
  };

  const wallet = await getWalletByUserId(userId);

  if (!wallet) {
    return {
      balance: "0",
      totalSent: "0",
      totalReceived: "0",
      transactionCount: 0,
    };
  }

  const [stats] = await db
    .select({
      totalSent: sql<string>`COALESCE(SUM(CASE WHEN ${walletTransactions.fromUserId} = ${userId} AND ${walletTransactions.status} = 'completed' THEN ${walletTransactions.amount}::numeric ELSE 0 END), 0)`,
      totalReceived: sql<string>`COALESCE(SUM(CASE WHEN ${walletTransactions.toUserId} = ${userId} AND ${walletTransactions.status} = 'completed' THEN ${walletTransactions.amount}::numeric ELSE 0 END), 0)`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(walletTransactions)
    .where(
      or(
        eq(walletTransactions.fromUserId, userId),
        eq(walletTransactions.toUserId, userId)
      )
    );

  return {
    balance: wallet.balance,
    totalSent: stats?.totalSent || "0",
    totalReceived: stats?.totalReceived || "0",
    transactionCount: stats?.transactionCount || 0,
  };
}

/**
 * Rechercher un utilisateur par numéro de téléphone pour transfert
 */
export async function findUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      email: users.email,
    })
    .from(users)
    .where(eq(users.phone, phone));

  return user || null;
}

/**
 * Créditer le wallet lors d'une vente (deposit from sale)
 */
export async function creditWalletFromSale(params: {
  userId: number;
  amount: string;
  saleId?: number;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { userId, amount, saleId, description } = params;

  const amountNum = parseFloat(amount);
  if (amountNum <= 0) {
    throw new Error("Le montant doit être supérieur à 0");
  }

  return await db.transaction(async (tx) => {
    let wallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .then(rows => rows[0]);

    if (!wallet) {
      const [newWallet] = await tx
        .insert(wallets)
        .values({
          userId,
          balance: "0",
          currency: "XOF",
          isActive: true,
        })
        .returning();
      wallet = newWallet;
    }

    const newBalance = (parseFloat(wallet.balance) + amountNum).toFixed(2);

    await tx
      .update(wallets)
      .set({
        balance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(wallets.id, wallet.id));

    const reference = generateTransactionReference();

    const [transaction] = await tx
      .insert(walletTransactions)
      .values({
        toWalletId: wallet.id,
        toUserId: userId,
        amount,
        currency: "XOF",
        type: "deposit",
        status: "completed",
        reference,
        description: description || `Vente #${saleId || 'N/A'}`,
        metadata: saleId ? JSON.stringify({ saleId }) : null,
        completedAt: new Date(),
      })
      .returning();

    return transaction;
  });
}
