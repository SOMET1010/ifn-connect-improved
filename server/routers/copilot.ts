import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { merchants } from '../../drizzle/schema';
import { sql, gte } from 'drizzle-orm';
import { getWeatherForAbidjan, getWeatherIcon } from '../weather';
import { generateContextualMessages } from '../contextual-messages';
import type { WeatherCondition, MerchantContext } from '../contextual-messages';

/**
 * Router pour le copilote SUTA
 * Fournit des données contextuelles : météo, activité du marché, etc.
 */
export const copilotRouter = router({
  /**
   * Générer des messages contextuels enrichis
   * Combine météo, heure, et données du marchand
   */
  contextualMessages: protectedProcedure
    .query(async ({ ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Récupérer le marchand
      const merchant = await db.query.merchants.findFirst({
        where: (merchants, { eq }) => eq(merchants.userId, userId),
      });

      if (!merchant) {
        return [];
      }

      // Récupérer la météo
      const weatherData = await getWeatherForAbidjan();
      const weather: WeatherCondition | null = weatherData ? {
        temp: weatherData.temperature,
        description: weatherData.description,
        main: weatherData.main,
        willRain: weatherData.rain,
        icon: getWeatherIcon(weatherData)
      } : null;

      // Récupérer les stats du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStats = await db.execute(sql`
        SELECT 
          COUNT(*) as salesCount,
          COALESCE(SUM(total_amount), 0) as totalSales
        FROM sales
        WHERE merchant_id = ${merchant.id}
        AND created_at >= ${today.toISOString()}
      `);

      // Récupérer le stock bas
      const lowStock = await db.execute(sql`
        SELECT COUNT(*) as lowStockCount
        FROM inventory
        WHERE merchant_id = ${merchant.id}
        AND quantity <= alert_threshold
      `);

      // Construire le contexte marchand
      const merchantContext: MerchantContext = {
        firstName: ctx.user.name?.split(' ')[0] || 'Ami(e)',
        salesCount: Number((todayStats.rows[0] as any)?.salesCount || 0),
        totalSales: Number((todayStats.rows[0] as any)?.totalSales || 0),
        lowStockCount: Number((lowStock.rows[0] as any)?.lowStockCount || 0),
      };

      // Générer les messages contextuels
      return generateContextualMessages(weather, merchantContext);
    }),

  /**
   * Récupérer la météo actuelle pour Abidjan
   * Utilise le module weather.ts avec cache intégré
   */
  weather: protectedProcedure
    .query(async () => {
      const weather = await getWeatherForAbidjan();
      
      if (!weather) {
        // Mode simulation si pas de clé API ou erreur
        return {
          temp: 28,
          description: "Ensoleillé",
          icon: "☀️",
          willRain: false,
          humidity: 75,
          windSpeed: 12,
        };
      }

      return {
        temp: weather.temperature,
        description: weather.description,
        icon: getWeatherIcon(weather),
        willRain: weather.rain,
        humidity: weather.humidity,
        windSpeed: Math.round(weather.windSpeed * 3.6), // m/s to km/h
      };
    }),

  /**
   * Statistiques du marché en temps réel
   * Nombre de marchands connectés aujourd'hui
   */
  marketStats: protectedProcedure
    .query(async () => {
      try {
        // Compter les marchands actifs (qui ont fait une vente dans les dernières 24h)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        // Pour l'instant, on retourne un nombre simulé
        // TODO: Implémenter le tracking des connexions réelles
        const db = await getDb();
        if (!db) {
          return {
            connectedMerchants: 10,
            totalMerchants: 50,
            lastUpdated: new Date(),
          };
        }
        const activeMerchants = await db
          .select({ count: sql<number>`count(distinct ${merchants.id})` })
          .from(merchants)
          .where(gte(merchants.createdAt, oneDayAgo));

        const count = activeMerchants[0]?.count || 0;

        // Simuler un nombre réaliste de marchands connectés
        const connectedCount = Math.max(5, Math.min(count, Math.floor(Math.random() * 15) + 5));

        return {
          connectedMerchants: connectedCount,
          totalMerchants: count,
          lastUpdated: new Date(),
        };
      } catch (error) {
        console.error("Market stats error:", error);
        return {
          connectedMerchants: 10,
          totalMerchants: 50,
          lastUpdated: new Date(),
        };
      }
    }),
});
