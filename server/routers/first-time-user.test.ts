import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { firstTimeUserProgress } from "../../drizzle/schema-first-time-user";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Tests pour le router firstTimeUser
 * Vérifie le système de tour guidé pour les nouveaux utilisateurs
 */

describe("firstTimeUser router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testUserId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Créer un utilisateur de test
    const [insertedUser] = await db.insert(users).values({
      openId: `test-first-time-${Date.now()}`,
      name: "Test First Time User",
      email: `test-first-time-${Date.now()}@example.com`,
      role: "merchant",
      language: "fr",
    });

    testUserId = insertedUser.insertId;

    // Créer un caller avec le contexte utilisateur
    const ctx: any = {
      user: {
        id: testUserId,
        openId: `test-first-time-${Date.now()}`,
        name: "Test First Time User",
        email: `test-first-time-${Date.now()}@example.com`,
        role: "merchant",
        language: "fr",
      },
      req: {},
      res: {},
    };
    caller = appRouter.createCaller(ctx);
  });

  it("devrait retourner null pour un nouvel utilisateur sans progression", async () => {
    const progress = await caller.firstTimeUser.getProgress();
    expect(progress).toBeNull();
  });

  it("devrait démarrer le tour guidé", async () => {
    const result = await caller.firstTimeUser.startTour();
    expect(result.success).toBe(true);

    const progress = await caller.firstTimeUser.getProgress();
    expect(progress).not.toBeNull();
    expect(progress?.currentStep).toBe(1);
    expect(progress?.totalSteps).toBe(5);
    expect(progress?.completed).toBe(false);
    expect(progress?.skipped).toBe(false);
  });

  it("devrait compléter une étape du tour", async () => {
    // Démarrer le tour
    await caller.firstTimeUser.startTour();

    // Compléter l'étape 1
    const result = await caller.firstTimeUser.completeStep({ step: 1 });
    expect(result.success).toBe(true);
    expect(result.nextStep).toBe(2);

    // Vérifier la progression
    const progress = await caller.firstTimeUser.getProgress();
    expect(progress?.currentStep).toBe(2);
    expect(progress?.lastStepCompletedAt).not.toBeNull();
  });

  it("devrait compléter toutes les étapes du tour", async () => {
    // Démarrer le tour
    await caller.firstTimeUser.startTour();

    // Compléter les 5 étapes
    for (let step = 1; step <= 5; step++) {
      await caller.firstTimeUser.completeStep({ step });
    }

    // Vérifier que l'étape reste à 5 après la dernière
    const progress = await caller.firstTimeUser.getProgress();
    expect(progress?.currentStep).toBe(5);
  });

  it("devrait terminer le tour guidé", async () => {
    // Démarrer le tour
    await caller.firstTimeUser.startTour();

    // Terminer le tour
    const result = await caller.firstTimeUser.completeTour();
    expect(result.success).toBe(true);

    // Vérifier la progression
    const progress = await caller.firstTimeUser.getProgress();
    expect(progress?.completed).toBe(true);
    expect(progress?.completedAt).not.toBeNull();
  });

  it("devrait ignorer le tour guidé", async () => {
    // Ignorer le tour sans l'avoir démarré
    const result = await caller.firstTimeUser.skipTour();
    expect(result.success).toBe(true);

    // Vérifier la progression
    const progress = await caller.firstTimeUser.getProgress();
    expect(progress?.skipped).toBe(true);
    expect(progress?.completed).toBe(false);
  });

  it("devrait réinitialiser le tour si déjà démarré", async () => {
    // Démarrer le tour
    await caller.firstTimeUser.startTour();

    // Compléter quelques étapes
    await caller.firstTimeUser.completeStep({ step: 1 });
    await caller.firstTimeUser.completeStep({ step: 2 });

    // Vérifier qu'on est à l'étape 3
    let progress = await caller.firstTimeUser.getProgress();
    expect(progress?.currentStep).toBe(3);

    // Redémarrer le tour
    await caller.firstTimeUser.startTour();

    // Vérifier que la progression est réinitialisée
    progress = await caller.firstTimeUser.getProgress();
    expect(progress?.currentStep).toBe(1);
    expect(progress?.completed).toBe(false);
    expect(progress?.skipped).toBe(false);
  });

  it("devrait gérer l'ignorance du tour après l'avoir démarré", async () => {
    // Démarrer le tour
    await caller.firstTimeUser.startTour();

    // Compléter une étape
    await caller.firstTimeUser.completeStep({ step: 1 });

    // Ignorer le tour
    await caller.firstTimeUser.skipTour();

    // Vérifier la progression
    const progress = await caller.firstTimeUser.getProgress();
    expect(progress?.skipped).toBe(true);
    expect(progress?.currentStep).toBe(2); // L'étape reste à 2
  });
});
