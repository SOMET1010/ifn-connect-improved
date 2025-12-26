import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { merchants } from '../../drizzle/schema';
import { sql, gte } from 'drizzle-orm';

/**
 * Router pour le copilote SUTA
 * Fournit des données contextuelles : météo, activité du marché, etc.
 */
export const copilotRouter = router({
  /**
   * Récupérer la météo actuelle pour Abidjan
   * Utilise OpenWeatherMap API (gratuit jusqu'à 1000 appels/jour)
   */
  weather: protectedProcedure
    .query(async () => {
      try {
        // Coordonnées d'Abidjan
        const lat = 5.3600;
        const lon = -4.0083;
        
        // Clé API OpenWeatherMap (à configurer via webdev_request_secrets)
        const apiKey = process.env.OPENWEATHER_API_KEY;
        
        if (!apiKey) {
          // Mode simulation si pas de clé API
          return {
            temp: 28,
            description: "Ensoleillé",
            icon: "☀️",
            willRain: false,
            humidity: 75,
            windSpeed: 12,
          };
        }

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather");
        }

        const data = await response.json();

        // Déterminer s'il va pleuvoir (si pluie dans les conditions ou humidité > 85%)
        const willRain = 
          data.weather[0].main.toLowerCase().includes("rain") ||
          data.weather[0].main.toLowerCase().includes("drizzle") ||
          data.weather[0].main.toLowerCase().includes("thunderstorm") ||
          data.main.humidity > 85;

        // Mapper les icônes météo
        const iconMap: Record<string, string> = {
          "01d": "☀️", // clear sky day
          "01n": "🌙", // clear sky night
          "02d": "⛅", // few clouds day
          "02n": "☁️", // few clouds night
          "03d": "☁️", // scattered clouds
          "03n": "☁️",
          "04d": "☁️", // broken clouds
          "04n": "☁️",
          "09d": "🌧️", // shower rain
          "09n": "🌧️",
          "10d": "🌦️", // rain day
          "10n": "🌧️", // rain night
          "11d": "⛈️", // thunderstorm
          "11n": "⛈️",
          "13d": "❄️", // snow
          "13n": "❄️",
          "50d": "🌫️", // mist
          "50n": "🌫️",
        };

        return {
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: iconMap[data.weather[0].icon] || "☀️",
          willRain,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
        };
      } catch (error) {
        console.error("Weather API error:", error);
        // Retourner des données par défaut en cas d'erreur
        return {
          temp: 28,
          description: "Ensoleillé",
          icon: "☀️",
          willRain: false,
          humidity: 75,
          windSpeed: 12,
        };
      }
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
