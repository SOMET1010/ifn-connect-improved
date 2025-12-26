import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getWeatherForAbidjan, generateWeatherAdvice, getWeatherSummary, getWeatherIcon } from '../weather';

export const weatherRouter = router({
  /**
   * Récupérer la météo actuelle pour Abidjan
   */
  current: protectedProcedure
    .query(async () => {
      const weather = await getWeatherForAbidjan();
      if (!weather) {
        return null;
      }

      return {
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        condition: weather.condition,
        description: weather.description,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        icon: getWeatherIcon(weather),
        rain: weather.rain,
        clouds: weather.clouds,
        summary: getWeatherSummary(weather),
      };
    }),

  /**
   * Récupérer les conseils météo personnalisés
   */
  advice: protectedProcedure
    .query(async () => {
      const weather = await getWeatherForAbidjan();
      if (!weather) {
        return [];
      }

      const advices = generateWeatherAdvice(weather);
      return advices;
    }),

  /**
   * Récupérer météo + conseils en une seule requête
   */
  full: protectedProcedure
    .query(async () => {
      const weather = await getWeatherForAbidjan();
      if (!weather) {
        return null;
      }

      const advices = generateWeatherAdvice(weather);

      return {
        weather: {
          temperature: weather.temperature,
          feelsLike: weather.feelsLike,
          condition: weather.condition,
          description: weather.description,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          icon: getWeatherIcon(weather),
          rain: weather.rain,
          clouds: weather.clouds,
          summary: getWeatherSummary(weather),
        },
        advices,
      };
    }),
});
