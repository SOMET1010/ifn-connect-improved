/**
 * Module de génération de messages contextuels pour le Copilote SUTA
 * Combine l'heure de la journée, la météo, et les données du marchand
 * pour générer des conseils personnalisés et pertinents
 */

export interface WeatherCondition {
  temp: number;
  description: string;
  main: string; // "Clear", "Rain", "Clouds", "Thunderstorm", etc.
  willRain: boolean;
  icon: string;
}

export interface MerchantContext {
  firstName: string;
  salesCount?: number;
  totalSales?: number;
  lowStockCount?: number;
  score?: number;
}

export interface ContextualMessage {
  id: string;
  text: string;
  type: "greeting" | "advice" | "weather" | "alert";
  icon: string;
  priority: number; // 1 = haute, 2 = moyenne, 3 = basse
}

/**
 * Détermine la période de la journée
 */
export function getTimeOfDay(hour: number): "dawn" | "morning" | "midday" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "midday";
  if (hour >= 14 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 21) return "evening";
  return "night";
}

/**
 * Génère un message de salutation basé sur l'heure
 */
export function getGreetingMessage(hour: number, firstName: string, weather?: WeatherCondition): ContextualMessage {
  const timeOfDay = getTimeOfDay(hour);
  
  const greetings: Record<typeof timeOfDay, { text: string; icon: string }> = {
    dawn: {
      text: `🌅 Bon matin ${firstName} ! Le jour se lève, c'est l'heure de préparer ton étal. Les premiers clients arrivent bientôt !`,
      icon: "🌅"
    },
    morning: {
      text: `☀️ Bonjour ${firstName} ! Belle matinée pour le commerce. ${weather?.main === "Clear" ? "Profite du beau temps pour exposer tes produits !" : "Prépare-toi pour une bonne journée !"}`,
      icon: "☀️"
    },
    midday: {
      text: `🌞 Bon midi ${firstName} ! C'est l'heure du rush. Garde ton stock à jour et ton sourire aux clients !`,
      icon: "🌞"
    },
    afternoon: {
      text: `☀️ Bon après-midi ${firstName} ! ${weather?.main === "Clear" ? "Profite du calme pour réapprovisionner." : "Continue ton bon travail !"}`,
      icon: "☀️"
    },
    evening: {
      text: `🌆 Bonsoir ${firstName} ! Dernière ligne droite avant la fermeture. N'oublie pas de compter ta caisse !`,
      icon: "🌆"
    },
    night: {
      text: `🌙 Bonne nuit ${firstName} ! Repose-toi bien, demain est un nouveau jour plein d'opportunités !`,
      icon: "🌙"
    }
  };

  return {
    id: "greeting",
    ...greetings[timeOfDay],
    type: "greeting",
    priority: 1
  };
}

/**
 * Génère des conseils météo détaillés
 */
export function getWeatherAdvice(weather: WeatherCondition, hour: number, firstName: string): ContextualMessage[] {
  const messages: ContextualMessage[] = [];
  const timeOfDay = getTimeOfDay(hour);

  // Pluie
  if (weather.willRain || weather.main === "Rain") {
    if (timeOfDay === "dawn" || timeOfDay === "morning") {
      messages.push({
        id: "weather-rain-morning",
        text: `🌧️ ${firstName}, il va pleuvoir aujourd'hui ! Prépare des bâches pour protéger tes marchandises. Range les produits sensibles à l'intérieur.`,
        type: "weather",
        icon: "🌧️",
        priority: 1
      });
    } else if (timeOfDay === "midday" || timeOfDay === "afternoon") {
      messages.push({
        id: "weather-rain-active",
        text: `☔ ${firstName}, la pluie arrive ! Rentre vite tes marchandises à l'abri. Protège surtout les céréales, le sel et les produits secs.`,
        type: "alert",
        icon: "☔",
        priority: 1
      });
    }
  }

  // Orage
  if (weather.main === "Thunderstorm") {
    messages.push({
      id: "weather-storm",
      text: `⛈️ ALERTE ${firstName} ! Orage prévu ! Sécurise ton stock immédiatement. Rentre tout à l'intérieur et coupe l'électricité si nécessaire.`,
      type: "alert",
      icon: "⛈️",
      priority: 1
    });
  }

  // Forte chaleur
  if (weather.temp > 32) {
    if (timeOfDay === "morning" || timeOfDay === "midday") {
      messages.push({
        id: "weather-heat",
        text: `🌡️ ${firstName}, il fait très chaud aujourd'hui (${weather.temp}°C) ! Protège les produits périssables (viandes, poissons, légumes). Mets-les à l'ombre ou au frais.`,
        type: "advice",
        icon: "🌡️",
        priority: 2
      });
    }
  }

  // Beau temps
  if (weather.main === "Clear" && !weather.willRain) {
    if (timeOfDay === "morning") {
      messages.push({
        id: "weather-sunny",
        text: `☀️ ${firstName}, beau temps aujourd'hui (${weather.temp}°C) ! C'est parfait pour exposer tes produits dehors et attirer les clients. Profite-en !`,
        type: "advice",
        icon: "☀️",
        priority: 2
      });
    }
  }

  // Temps nuageux
  if (weather.main === "Clouds" && !weather.willRain) {
    if (timeOfDay === "morning" || timeOfDay === "midday") {
      messages.push({
        id: "weather-clouds",
        text: `☁️ ${firstName}, temps couvert aujourd'hui. Garde un œil sur le ciel et prépare-toi à rentrer tes marchandises si la pluie arrive.`,
        type: "advice",
        icon: "☁️",
        priority: 3
      });
    }
  }

  return messages;
}

/**
 * Génère des conseils basés sur l'heure et l'activité commerciale
 */
export function getBusinessAdvice(hour: number, firstName: string, context: MerchantContext): ContextualMessage[] {
  const messages: ContextualMessage[] = [];
  const timeOfDay = getTimeOfDay(hour);

  // Conseils matinaux
  if (timeOfDay === "dawn" || timeOfDay === "morning") {
    if (!context.salesCount || context.salesCount === 0) {
      messages.push({
        id: "advice-morning-prep",
        text: `💼 ${firstName}, vérifie ton stock avant l'arrivée des clients. Assure-toi d'avoir assez de monnaie pour rendre. Prépare tes produits les plus populaires en évidence !`,
        type: "advice",
        icon: "💼",
        priority: 2
      });
    }
  }

  // Conseils midi (rush)
  if (timeOfDay === "midday") {
    if (context.salesCount && context.salesCount > 0) {
      messages.push({
        id: "advice-midday-rush",
        text: `🔥 ${firstName}, c'est l'heure du rush ! Sois rapide avec les clients, garde ton stock visible, et n'oublie pas d'enregistrer chaque vente dans la caisse !`,
        type: "advice",
        icon: "🔥",
        priority: 2
      });
    } else {
      messages.push({
        id: "advice-midday-slow",
        text: `📢 ${firstName}, c'est calme ? Profite-en pour attirer les clients : arrange ton étal, mets les beaux produits devant, souris aux passants !`,
        type: "advice",
        icon: "📢",
        priority: 2
      });
    }
  }

  // Conseils après-midi
  if (timeOfDay === "afternoon") {
    if (context.lowStockCount && context.lowStockCount > 0) {
      messages.push({
        id: "advice-afternoon-restock",
        text: `📦 ${firstName}, profite du calme de l'après-midi pour commander tes produits en rupture. Va sur le marché virtuel pour réapprovisionner !`,
        type: "advice",
        icon: "📦",
        priority: 2
      });
    } else {
      messages.push({
        id: "advice-afternoon-prep",
        text: `✨ ${firstName}, prépare-toi pour le rush du soir. Vérifie ton stock, nettoie ton étal, et prépare la monnaie !`,
        type: "advice",
        icon: "✨",
        priority: 3
      });
    }
  }

  // Conseils soir
  if (timeOfDay === "evening") {
    messages.push({
      id: "advice-evening-closing",
      text: `🧮 ${firstName}, bientôt la fermeture ! Compte ta caisse, vérifie tes ventes du jour, et prépare ta liste de courses pour demain.`,
      type: "advice",
      icon: "🧮",
      priority: 2
    });
  }

  // Conseils nuit
  if (timeOfDay === "night") {
    messages.push({
      id: "advice-night-rest",
      text: `😴 ${firstName}, repose-toi bien ! Un bon sommeil = un bon marchand. Demain est un nouveau jour plein d'opportunités !`,
      type: "advice",
      icon: "😴",
      priority: 3
    });
  }

  return messages;
}

/**
 * Génère tous les messages contextuels pour le Copilote
 */
export function generateContextualMessages(
  weather: WeatherCondition | null,
  merchantContext: MerchantContext
): ContextualMessage[] {
  const hour = new Date().getHours();
  const messages: ContextualMessage[] = [];

  // 1. Message de salutation (toujours en premier)
  messages.push(getGreetingMessage(hour, merchantContext.firstName, weather || undefined));

  // 2. Conseils météo (priorité haute si alerte)
  if (weather) {
    messages.push(...getWeatherAdvice(weather, hour, merchantContext.firstName));
  }

  // 3. Conseils business (basés sur l'heure et l'activité)
  messages.push(...getBusinessAdvice(hour, merchantContext.firstName, merchantContext));

  // Trier par priorité (1 = plus important)
  return messages.sort((a, b) => a.priority - b.priority);
}
