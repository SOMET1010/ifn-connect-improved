import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as dbMarkets from "../db-markets";

/**
 * Router tRPC pour les marchés et acteurs
 */
export const marketsRouter = router({
  // ========================================================================
  // MARKETS
  // ========================================================================
  
  /**
   * Liste tous les marchés
   */
  list: publicProcedure.query(async () => {
    return await dbMarkets.getAllMarkets();
  }),

  /**
   * Récupère un marché par ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await dbMarkets.getMarketById(input.id);
    }),

  /**
   * Récupère les marchés géolocalisés pour la carte
   */
  geolocated: publicProcedure.query(async () => {
    return await dbMarkets.getGeolocatedMarkets();
  }),

  /**
   * Récupère les statistiques d'un marché
   */
  stats: publicProcedure
    .input(z.object({ marketId: z.number() }))
    .query(async ({ input }) => {
      return await dbMarkets.getMarketStats(input.marketId);
    }),

  /**
   * Récupère un marché avec tous ses acteurs
   */
  withActors: publicProcedure
    .input(z.object({ marketId: z.number() }))
    .query(async ({ input }) => {
      return await dbMarkets.getMarketWithActors(input.marketId);
    }),

  /**
   * Met à jour la géolocalisation d'un marché (admin uniquement)
   */
  updateGeolocation: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new Error("Accès refusé : admin uniquement");
      }

      const success = await dbMarkets.updateMarketGeolocation(
        input.id,
        input.latitude,
        input.longitude,
        input.address
      );

      if (!success) {
        throw new Error("Échec de la mise à jour de la géolocalisation");
      }

      return { success: true };
    }),

  // ========================================================================
  // ACTORS
  // ========================================================================

  /**
   * Liste les acteurs avec pagination
   */
  actors: router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(500).default(100),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return await dbMarkets.getAllActors(input.limit, input.offset);
      }),

    /**
     * Récupère un acteur par ID
     */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await dbMarkets.getActorById(input.id);
      }),

    /**
     * Récupère un acteur par clé unique
     */
    getByKey: publicProcedure
      .input(z.object({ actorKey: z.string() }))
      .query(async ({ input }) => {
        return await dbMarkets.getActorByKey(input.actorKey);
      }),

    /**
     * Liste les acteurs d'un marché
     */
    byMarket: publicProcedure
      .input(
        z.object({
          marketId: z.number(),
          limit: z.number().min(1).max(500).default(100),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return await dbMarkets.getActorsByMarket(
          input.marketId,
          input.limit,
          input.offset
        );
      }),

    /**
     * Recherche par code identificateur (carte)
     */
    searchByIdentifier: publicProcedure
      .input(z.object({ identifierCode: z.string().min(1) }))
      .query(async ({ input }) => {
        return await dbMarkets.searchActorsByIdentifier(input.identifierCode);
      }),

    /**
     * Recherche par numéro de téléphone
     */
    searchByPhone: publicProcedure
      .input(z.object({ phone: z.string().min(1) }))
      .query(async ({ input }) => {
        return await dbMarkets.searchActorsByPhone(input.phone);
      }),

    /**
     * Recherche par nom
     */
    searchByName: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          limit: z.number().min(1).max(100).default(50),
        })
      )
      .query(async ({ input }) => {
        return await dbMarkets.searchActorsByName(input.name, input.limit);
      }),

    /**
     * Met à jour un acteur (agents et admin)
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          fullName: z.string().optional(),
          phone: z.string().optional(),
          identifierCode: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Vérifier que l'utilisateur est agent ou admin
        if (ctx.user.role !== "agent" && ctx.user.role !== "admin") {
          throw new Error("Accès refusé : agent ou admin uniquement");
        }

        const { id, ...data } = input;
        const success = await dbMarkets.updateActor(id, data);

        if (!success) {
          throw new Error("Échec de la mise à jour de l'acteur");
        }

        return { success: true };
      }),
  }),

  // ========================================================================
  // STATISTICS
  // ========================================================================

  /**
   * Statistiques globales
   */
  globalStats: publicProcedure.query(async () => {
    return await dbMarkets.getGlobalStats();
  }),
});
