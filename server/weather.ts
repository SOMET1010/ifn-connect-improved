/**
 * Module d'intégration API météo OpenWeatherMap
 * Fournit des données météo pour Abidjan et génère des conseils contextuels
 */

interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  rain: boolean;
  clouds: number;
}

interface WeatherAdvice {
  message: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  action?: string;
}

// Cache simple en mémoire (expire après 30 minutes)
let weatherCache: { data: WeatherData; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Récupérer les données météo pour Abidjan
 */
export async function getWeatherForAbidjan(): Promise<WeatherData | null> {
  // Vérifier le cache
  if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
    return weatherCache.data;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('OPENWEATHER_API_KEY not configured');
    return null;
  }

  try {
    // Coordonnées d'Abidjan
    const lat = 5.3600;
    const lon = -4.0083;
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();
    
    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      icon: data.weather[0].icon,
      rain: data.weather[0].main === 'Rain' || data.weather[0].main === 'Drizzle' || data.weather[0].main === 'Thunderstorm',
      clouds: data.clouds.all,
    };

    // Mettre à jour le cache
    weatherCache = {
      data: weatherData,
      timestamp: Date.now(),
    };

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

/**
 * Analyser les conditions météo et générer des conseils
 */
export function generateWeatherAdvice(weather: WeatherData): WeatherAdvice[] {
  const advices: WeatherAdvice[] = [];

  // Conseils basés sur la pluie
  if (weather.rain) {
    advices.push({
      message: '🌧️ Risque de pluie ! Range tes marchandises à l\'abri pour éviter les pertes.',
      icon: '🌧️',
      priority: 'high',
      action: 'Protège ton stock maintenant',
    });
  }

  // Conseils basés sur les orages
  if (weather.condition === 'Thunderstorm') {
    advices.push({
      message: '⛈️ Orage prévu ! Protège ton stock et mets-toi à l\'abri en sécurité.',
      icon: '⛈️',
      priority: 'high',
      action: 'Sécurise ton espace de vente',
    });
  }

  // Conseils basés sur le beau temps
  if (weather.condition === 'Clear' && weather.clouds < 30) {
    advices.push({
      message: '☀️ Beau temps aujourd\'hui ! Expose tes produits dehors pour attirer plus de clients.',
      icon: '☀️',
      priority: 'medium',
      action: 'Profite du soleil',
    });
  }

  // Conseils basés sur la chaleur
  if (weather.temperature > 32) {
    advices.push({
      message: '🌡️ Forte chaleur ! Protège les produits périssables et garde-toi bien hydraté.',
      icon: '🌡️',
      priority: 'medium',
      action: 'Protège les produits frais',
    });
  }

  // Conseils basés sur les nuages
  if (weather.clouds > 70 && !weather.rain) {
    advices.push({
      message: '☁️ Temps nuageux, prépare-toi à une possible pluie dans les prochaines heures.',
      icon: '☁️',
      priority: 'low',
      action: 'Surveille le ciel',
    });
  }

  // Conseils basés sur le vent
  if (weather.windSpeed > 10) {
    advices.push({
      message: '💨 Vent fort ! Sécurise tes étalages et protège les produits légers.',
      icon: '💨',
      priority: 'medium',
      action: 'Fixe bien tes produits',
    });
  }

  // Si aucun conseil spécifique, donner un conseil général
  if (advices.length === 0) {
    advices.push({
      message: `🌤️ Temps agréable à ${weather.temperature}°C. Bonne journée de vente !`,
      icon: '🌤️',
      priority: 'low',
    });
  }

  return advices;
}

/**
 * Obtenir un résumé météo formaté
 */
export function getWeatherSummary(weather: WeatherData): string {
  return `${weather.temperature}°C, ${weather.description}`;
}

/**
 * Obtenir l'icône météo appropriée
 */
export function getWeatherIcon(weather: WeatherData): string {
  const iconMap: Record<string, string> = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️',
  };

  return iconMap[weather.condition] || '🌤️';
}
