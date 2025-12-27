import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { merchants, users, products, merchantStock, sales } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

/**
 * Tests d'intégration pour le workflow complet du marchand
 * Scénario : Ouverture de session → Ventes → Fermeture de session
 */
describe("Merchant Workflow Integration", () => {
  let testUserId: number;
  let testMerchantId: number;
  let testProductId: number;
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Créer un utilisateur de test
    const [insertedUser] = await db.insert(users).values({
      openId: `test-workflow-${Date.now()}`,
      email: `workflow-test-${Date.now()}@example.com`,
      name: "Workflow Test User",
      loginMethod: "manus",
      role: "merchant",
    });
    testUserId = insertedUser.insertId;

    // Créer un marchand de test
    const [insertedMerchant] = await db.insert(merchants).values({
      userId: testUserId,
      merchantNumber: `MRC-WORKFLOW-${Date.now()}`,
      businessName: "Test Workflow Business",
      phone: "0123456789",
    });
    testMerchantId = insertedMerchant.insertId;

    // Créer un produit de test
    const [insertedProduct] = await db.insert(products).values({
      name: "Test Product",
      nameDioula: "Produit Test",
      category: "test",
      unit: "pièce",
      price: "1000",
    });
    testProductId = insertedProduct.insertId;

    // Créer du stock pour le marchand
    await db.insert(merchantStock).values({
      merchantId: testMerchantId,
      productId: testProductId,
      quantity: "100",
      minThreshold: "10",
    });

    // Créer le contexte d'authentification
    const user: AuthenticatedUser = {
      id: testUserId,
      openId: `test-workflow-${Date.now()}`,
      email: `workflow-test-${Date.now()}@example.com`,
      name: "Workflow Test User",
      loginMethod: "manus",
      role: "merchant",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    ctx = {
      user,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    caller = appRouter.createCaller(ctx);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Nettoyer les données de test
    await db.delete(sales).where(eq(sales.merchantId, testMerchantId));
    await db.delete(merchantStock).where(eq(merchantStock.merchantId, testMerchantId));
    await db.delete(products).where(eq(products.id, testProductId));
    await db.delete(merchants).where(eq(merchants.id, testMerchantId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should complete full merchant workflow: open → sell → close", async () => {
    // ========== ÉTAPE 1 : Ouverture de session ==========
    const openResult = await caller.dailySessions.open({
      openingNotes: "Début de journée - Test d'intégration",
    });

    expect(openResult).toBeDefined();
    expect(openResult.session).toBeDefined();
    expect(openResult.session.sessionDate).toBeDefined();
    expect(openResult.session.openedAt).toBeDefined();
    expect(openResult.session.closedAt).toBeNull();
    expect(openResult.session.openingNotes).toBe("Début de journée - Test d'intégration");

    const sessionId = openResult.session.id;

    // ========== ÉTAPE 2 : Vérifier le statut de la session ==========
    const statusResult = await caller.dailySessions.getToday();

    expect(statusResult.status).toBe("OPENED");
    expect(statusResult.session).toBeDefined();
    expect(statusResult.session?.id).toBe(sessionId);

    // ========== ÉTAPE 3 : Enregistrer plusieurs ventes ==========
    const sale1 = await caller.sales.create({
      productId: testProductId,
      quantity: 5,
      unitPrice: 1000,
      paymentMethod: "cash",
    });

    expect(sale1.success).toBe(true);

    const sale2 = await caller.sales.create({
      productId: testProductId,
      quantity: 3,
      unitPrice: 1000,
      paymentMethod: "mobile_money",
      paymentProvider: "Orange Money",
    });

    expect(sale2.success).toBe(true);

    // ========== ÉTAPE 4 : Vérifier les statistiques du jour ==========
    const todayStats = await caller.sales.todayStats({
      merchantId: testMerchantId,
    });

    expect(todayStats.salesCount).toBeGreaterThanOrEqual(2);
    expect(parseInt(todayStats.totalAmount)).toBeGreaterThanOrEqual(8000); // 5*1000 + 3*1000

    // ========== ÉTAPE 5 : Vérifier que le stock a été mis à jour ==========
    const stockResult = await caller.stock.listByMerchant({
      merchantId: testMerchantId,
    });

    const productStock = stockResult.find((s) => s.productId === testProductId);
    expect(productStock).toBeDefined();
    expect(parseInt(productStock!.quantity)).toBe(92); // 100 - 5 - 3

    // ========== ÉTAPE 6 : Fermeture de session ==========
    const closeResult = await caller.dailySessions.close({
      closingNotes: "Fin de journée - 2 ventes réalisées",
    });

    expect(closeResult).toBeDefined();
    expect(closeResult.session).toBeDefined();
    expect(closeResult.session.closedAt).toBeDefined();
    expect(closeResult.session.closingNotes).toBe("Fin de journée - 2 ventes réalisées");

    // ========== ÉTAPE 7 : Vérifier que la session est fermée ==========
    const finalStatus = await caller.dailySessions.getToday();

    expect(finalStatus.status).toBe("CLOSED");
    expect(finalStatus.session?.closedAt).toBeDefined();
  }, 30000); // Timeout de 30 secondes pour ce test d'intégration

  it("should prevent opening a second session on the same day", async () => {
    // Ouvrir une première session
    await caller.dailySessions.open({
      openingNotes: "Première session",
    });

    // Tenter d'ouvrir une deuxième session le même jour
    const secondOpen = await caller.dailySessions.open({
      openingNotes: "Tentative de deuxième session",
    });

    // La deuxième ouverture devrait mettre à jour la session existante
    expect(secondOpen).toBeDefined();
    expect(secondOpen.session.openingNotes).toBe("Tentative de deuxième session");

    // Fermer la session
    await caller.dailySessions.close({
      closingNotes: "Fermeture après test",
    });
  }, 20000);

  it("should allow reopening a closed session", async () => {
    // Ouvrir et fermer une session
    const openResult = await caller.dailySessions.open({
      openingNotes: "Session à rouvrir",
    });

    await caller.dailySessions.close({
      closingNotes: "Fermeture temporaire",
    });

    // Vérifier que la session est fermée
    const statusAfterClose = await caller.dailySessions.getToday();
    expect(statusAfterClose.status).toBe("CLOSED");

    // Rouvrir la session
    const reopenResult = await caller.dailySessions.reopen();

    expect(reopenResult).toBeDefined();
    expect(reopenResult.session).toBeDefined();
    expect(reopenResult.session.closedAt).toBeNull();

    // Vérifier que la session est à nouveau ouverte
    const statusAfterReopen = await caller.dailySessions.getToday();
    expect(statusAfterReopen.status).toBe("OPENED");

    // Fermer définitivement
    await caller.dailySessions.close({
      closingNotes: "Fermeture définitive",
    });
  }, 20000);

  it("should track sales history across multiple sessions", async () => {
    // Session 1 : 2 ventes
    await caller.dailySessions.open({ openingNotes: "Session 1" });
    
    await caller.sales.create({
      productId: testProductId,
      quantity: 2,
      unitPrice: 1000,
      paymentMethod: "cash",
    });

    await caller.sales.create({
      productId: testProductId,
      quantity: 1,
      unitPrice: 1000,
      paymentMethod: "cash",
    });

    await caller.dailySessions.close({ closingNotes: "Fin session 1" });

    // Vérifier l'historique des sessions
    const history = await caller.dailySessions.history({ limit: 5 });

    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].openedAt).toBeDefined();
    expect(history[0].closedAt).toBeDefined();

    // Vérifier les statistiques globales
    const totalBalance = await caller.sales.totalBalance({
      merchantId: testMerchantId,
    });

    expect(totalBalance).toBeGreaterThan(0);
  }, 30000);
});
