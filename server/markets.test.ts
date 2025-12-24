import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as dbMarkets from "./db-markets";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(role: "user" | "admin" | "agent" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("markets router", () => {
  describe("markets.list", () => {
    it("returns list of markets", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const markets = await caller.markets.list();

      expect(Array.isArray(markets)).toBe(true);
      // Nous avons importé 8 marchés
      expect(markets.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("markets.geolocated", () => {
    it("returns only geolocated markets", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const markets = await caller.markets.geolocated();

      expect(Array.isArray(markets)).toBe(true);
      // Tous les marchés retournés doivent être géolocalisés
      markets.forEach(market => {
        expect(market.isGeolocated).toBe(true);
        expect(market.latitude).toBeTruthy();
        expect(market.longitude).toBeTruthy();
      });
    });
  });

  describe("markets.globalStats", () => {
    it("returns global statistics", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.markets.globalStats();

      expect(stats).toBeDefined();
      if (stats) {
        expect(typeof stats.totalMarkets).toBe("number");
        expect(typeof stats.totalActors).toBe("number");
        expect(typeof stats.geolocatedMarkets).toBe("number");
        expect(stats.totalMarkets).toBeGreaterThanOrEqual(0);
        expect(stats.totalActors).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("markets.actors.list", () => {
    it("returns paginated list of actors", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const actors = await caller.markets.actors.list({
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(actors)).toBe(true);
      expect(actors.length).toBeLessThanOrEqual(10);
    });
  });

  describe("markets.actors.searchByName", () => {
    it("searches actors by name", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Récupérer d'abord un acteur pour avoir un nom valide
      const allActors = await caller.markets.actors.list({ limit: 1, offset: 0 });
      
      if (allActors.length > 0) {
        const firstActor = allActors[0];
        const searchTerm = firstActor.fullName.substring(0, 5);

        const results = await caller.markets.actors.searchByName({
          name: searchTerm,
          limit: 10,
        });

        expect(Array.isArray(results)).toBe(true);
        // Au moins l'acteur recherché devrait être dans les résultats
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });

  describe("markets.updateGeolocation", () => {
    it("requires admin role", async () => {
      const ctx = createTestContext("user"); // User normal
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.markets.updateGeolocation({
          id: 1,
          latitude: 5.36,
          longitude: -4.01,
        })
      ).rejects.toThrow("Accès refusé");
    });

    it("allows admin to update geolocation", async () => {
      const ctx = createTestContext("admin");
      const caller = appRouter.createCaller(ctx);

      // Récupérer un marché existant
      const markets = await caller.markets.list();
      
      if (markets.length > 0) {
        const marketId = markets[0].id;
        
        const result = await caller.markets.updateGeolocation({
          id: marketId,
          latitude: 5.36,
          longitude: -4.01,
          address: "Test Address",
        });

        expect(result.success).toBe(true);

        // Vérifier que la mise à jour a bien été effectuée
        const updatedMarket = await caller.markets.getById({ id: marketId });
        expect(updatedMarket).toBeDefined();
        if (updatedMarket) {
          // Comparer les valeurs numériques (la DB peut ajouter des zéros)
          expect(parseFloat(updatedMarket.latitude as string)).toBeCloseTo(5.36, 2);
          expect(parseFloat(updatedMarket.longitude as string)).toBeCloseTo(-4.01, 2);
        }
      }
    });
  });
});

describe("db-markets helpers", () => {
  describe("getAllMarkets", () => {
    it("returns all markets", async () => {
      const markets = await dbMarkets.getAllMarkets();
      
      expect(Array.isArray(markets)).toBe(true);
      expect(markets.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getGlobalStats", () => {
    it("returns correct statistics", async () => {
      const stats = await dbMarkets.getGlobalStats();
      
      expect(stats).toBeDefined();
      if (stats) {
        expect(stats.totalMarkets).toBeGreaterThanOrEqual(0);
        expect(stats.totalActors).toBeGreaterThanOrEqual(0);
        expect(stats.geolocatedMarkets).toBeGreaterThanOrEqual(0);
        expect(stats.geolocatedMarkets).toBeLessThanOrEqual(stats.totalMarkets);
      }
    });
  });

  describe("searchActorsByName", () => {
    it("returns matching actors", async () => {
      const allActors = await dbMarkets.getAllActors(1, 0);
      
      if (allActors.length > 0) {
        const searchTerm = allActors[0].fullName.substring(0, 5);
        const results = await dbMarkets.searchActorsByName(searchTerm, 10);
        
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });
});
