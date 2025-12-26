import { describe, it, expect } from 'vitest';
import { getWeatherForAbidjan, generateWeatherAdvice } from './weather';

describe('Weather Integration', () => {
  it('should fetch weather data for Abidjan with valid API key', async () => {
    const weather = await getWeatherForAbidjan();
    
    // Si la clé API n'est pas configurée, le test passe quand même
    if (!process.env.OPENWEATHER_API_KEY) {
      console.warn('OPENWEATHER_API_KEY not set, skipping weather test');
      expect(weather).toBeNull();
      return;
    }

    // Si la clé est configurée, vérifier que les données sont valides
    expect(weather).not.toBeNull();
    if (weather) {
      expect(weather.temperature).toBeTypeOf('number');
      expect(weather.condition).toBeTypeOf('string');
      expect(weather.description).toBeTypeOf('string');
      expect(weather.humidity).toBeTypeOf('number');
      expect(weather.windSpeed).toBeTypeOf('number');
      expect(weather.icon).toBeTypeOf('string');
      expect(weather.rain).toBeTypeOf('boolean');
      expect(weather.clouds).toBeTypeOf('number');
      
      // Vérifier que la température est dans une plage réaliste pour Abidjan
      expect(weather.temperature).toBeGreaterThan(15);
      expect(weather.temperature).toBeLessThan(45);
    }
  }, { timeout: 10000 }); // Timeout de 10 secondes pour l'appel API

  it('should generate weather advice based on conditions', async () => {
    const weather = await getWeatherForAbidjan();
    
    if (!weather) {
      console.warn('No weather data available, skipping advice test');
      return;
    }

    const advices = generateWeatherAdvice(weather);
    
    expect(advices).toBeInstanceOf(Array);
    expect(advices.length).toBeGreaterThan(0);
    
    // Vérifier la structure des conseils
    advices.forEach(advice => {
      expect(advice).toHaveProperty('message');
      expect(advice).toHaveProperty('icon');
      expect(advice).toHaveProperty('priority');
      expect(['low', 'medium', 'high']).toContain(advice.priority);
    });
  }, { timeout: 10000 });

  it('should cache weather data for 30 minutes', async () => {
    if (!process.env.OPENWEATHER_API_KEY) {
      console.warn('OPENWEATHER_API_KEY not set, skipping cache test');
      return;
    }

    const weather1 = await getWeatherForAbidjan();
    const weather2 = await getWeatherForAbidjan();
    
    // Les deux appels devraient retourner les mêmes données (du cache)
    expect(weather1).toEqual(weather2);
  }, { timeout: 15000 });
});
