import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  getUpcomingEvents,
  getEventById,
  getStockRecommendations,
  getUnreadAlerts,
  markAlertAsRead,
  getEventsWithRecommendations,
  createEvent,
  addStockRecommendation,
  createEventAlert,
} from "../db-events";

export const eventsRouter = router({
  /**
   * Récupérer les événements à venir
   */
  getUpcoming: publicProcedure
    .input(
      z.object({
        daysAhead: z.number().optional().default(60),
      })
    )
    .query(async ({ input }) => {
      return await getUpcomingEvents(input.daysAhead);
    }),

  /**
   * Récupérer un événement par ID avec ses recommandations
   */
  getById: publicProcedure
    .input(
      z.object({
        eventId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const event = await getEventById(input.eventId);
      if (!event) return null;

      const recommendations = await getStockRecommendations(input.eventId);
      return { ...event, recommendations };
    }),

  /**
   * Récupérer tous les événements avec recommandations
   */
  getWithRecommendations: publicProcedure.query(async () => {
    return await getEventsWithRecommendations();
  }),

  /**
   * Récupérer les alertes non lues d'un marchand
   */
  getAlerts: protectedProcedure
    .input(
      z.object({
        merchantId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getUnreadAlerts(input.merchantId);
    }),

  /**
   * Marquer une alerte comme lue
   */
  markAlertRead: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await markAlertAsRead(input.alertId);
      return { success: true };
    }),

  /**
   * Créer un événement personnalisé (admin)
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["religious", "national", "cultural", "commercial"]),
        date: z.string(), // Format YYYY-MM-DD
        endDate: z.string().optional(),
        description: z.string().optional(),
        isRecurring: z.boolean().optional().default(false),
        iconEmoji: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const eventData = {
        ...input,
        date: new Date(input.date),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };
      return await createEvent(eventData as any);
    }),

  /**
   * Ajouter une recommandation de stock pour un événement
   */
  addRecommendation: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        productName: z.string(),
        category: z.string().optional(),
        priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
        estimatedDemandIncrease: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await addStockRecommendation(input);
    }),
});
