import { useState, useEffect } from "react";
import { X, Volume2, VolumeX, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface CopilotMessage {
  id: string;
  text: string;
  type: "greeting" | "stats" | "alert" | "advice" | "weather" | "market";
  icon?: string;
  timestamp: Date;
}

export function CopilotAssistant() {
  const { user, merchant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Récupérer les statistiques du marchand
  const { data: todayStats } = trpc.sales.todayStats.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant, refetchInterval: 60000 } // Rafraîchir chaque minute
  );

  // Récupérer le stock bas
  const { data: lowStock } = trpc.stock.lowStock.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  // Récupérer la météo
  const { data: weather } = trpc.copilot.weather.useQuery(
    undefined,
    { enabled: !!merchant, refetchInterval: 300000 } // Rafraîchir toutes les 5 minutes
  );

  // Récupérer les stats du marché
  const { data: marketStats } = trpc.copilot.marketStats.useQuery(
    undefined,
    { enabled: !!merchant, refetchInterval: 120000 } // Rafraîchir toutes les 2 minutes
  );

  // Récupérer les événements à venir avec recommandations (30 prochains jours)
  const { data: upcomingEvents } = trpc.events.getWithRecommendations.useQuery(
    undefined,
    { enabled: !!merchant, refetchInterval: 3600000 } // Rafraîchir toutes les heures
  );

  // Générer les messages personnalisés
  useEffect(() => {
    if (!merchant || !user) return;

    const newMessages: CopilotMessage[] = [];
    const hour = new Date().getHours();
    const firstName = user.name?.split(" ")[0] || "Ami(e)";

    // Message de salutation basé sur l'heure
    if (hour < 12) {
      newMessages.push({
        id: "greeting",
        text: `🌅 Bonjour ${firstName} ! Je suis SUTA, ton assistant ANSUT. Prêt(e) pour une belle journée de commerce ?`,
        type: "greeting",
        icon: "👋",
        timestamp: new Date(),
      });
    } else if (hour < 18) {
      newMessages.push({
        id: "greeting",
        text: `☀️ Bon après-midi ${firstName} ! SUTA est là pour t'aider. Comment se passe ta journée ?`,
        type: "greeting",
        icon: "👋",
        timestamp: new Date(),
      });
    } else {
      newMessages.push({
        id: "greeting",
        text: `🌙 Bonsoir ${firstName} ! SUTA espère que tu as passé une bonne journée. N'oublie pas de compter ta caisse !`,
        type: "greeting",
        icon: "👋",
        timestamp: new Date(),
      });
    }

    // Statistiques du jour
    if (todayStats) {
      const totalSales = parseFloat(String(todayStats.totalSales || "0"));
      const salesCount = todayStats.salesCount || 0;

      if (salesCount > 0) {
        newMessages.push({
          id: "stats",
          text: `📊 Aujourd'hui, tu as déjà fait ${salesCount} vente${salesCount > 1 ? "s" : ""} pour un total de ${totalSales.toLocaleString("fr-FR")} FCFA. ${
            salesCount >= 5 ? "Bravo ! Continue comme ça !" : "C'est un bon début !"
          }`,
          type: "stats",
          icon: "💰",
          timestamp: new Date(),
        });
      } else if (hour > 10) {
        newMessages.push({
          id: "stats",
          text: `📊 ${firstName}, tu n'as pas encore enregistré de vente aujourd'hui. N'oublie pas d'enregistrer chaque vente dans la caisse !`,
          type: "alert",
          icon: "⚠️",
          timestamp: new Date(),
        });
      }
    }

    // Message météo
    if (weather) {
      if (weather.willRain) {
        newMessages.push({
          id: "weather-rain",
          text: `${weather.icon} Attention ${firstName} ! Il risque de pleuvoir aujourd'hui. Range tes marchandises à l'abri et protège-les de la pluie !`,
          type: "weather",
          icon: "🌧️",
          timestamp: new Date(),
        });
      } else if (hour >= 8 && hour < 10) {
        newMessages.push({
          id: "weather-good",
          text: `${weather.icon} ${firstName}, il fait ${weather.description} aujourd'hui (${weather.temp}°C). C'est parfait pour exposer tes produits dehors !`,
          type: "weather",
          icon: weather.icon,
          timestamp: new Date(),
        });
      }
    }

    // Statistiques du marché
    if (marketStats && hour >= 8 && hour < 11) {
      newMessages.push({
        id: "market-stats",
        text: `🏪 ${firstName}, il y a ${marketStats.connectedMerchants} commerçants connectés au marché aujourd'hui. ${marketStats.connectedMerchants >= 10 ? "C'est un bon jour pour vendre !" : "Le marché est calme aujourd'hui."}`,
        type: "market",
        icon: "👥",
        timestamp: new Date(),
      });
    }

    // Alertes stock bas
    if (lowStock && lowStock.length > 0) {
      const productNames = lowStock.slice(0, 3).map((item) => item.productName).join(", ");
      newMessages.push({
        id: "stock-alert",
        text: `📦 Attention ${firstName} ! Tu as ${lowStock.length} produit${lowStock.length > 1 ? "s" : ""} en stock bas : ${productNames}${
          lowStock.length > 3 ? "..." : ""
        }. Tu dois commander bientôt !`,
        type: "alert",
        icon: "⚠️",
        timestamp: new Date(),
      });
    }

    // Alertes événements à venir
    if (upcomingEvents && upcomingEvents.length > 0) {
      // Prendre les 2 événements les plus proches
      upcomingEvents.slice(0, 2).forEach((event) => {
        const eventDate = new Date(event.date);
        const today = new Date();
        const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 7 && daysUntil > 0) {
          let urgencyText = "";
          if (daysUntil === 1) urgencyText = "demain";
          else if (daysUntil <= 3) urgencyText = `dans ${daysUntil} jours`;
          else urgencyText = `dans ${daysUntil} jours`;

          // Construire le message avec recommandations de stock
          let message = `${event.iconEmoji || "📅"} ${firstName}, ${event.name} commence ${urgencyText} !`;
          
          // Ajouter les recommandations de stock (top 3-5 produits)
          if (event.recommendations && event.recommendations.length > 0) {
            const topProducts = event.recommendations
              .slice(0, 5)
              .map((r: any) => `${r.productName} (+${r.demandIncrease}%)`)
              .join(", ");
            message += ` Commande : ${topProducts}.`;
          } else {
            message += " Fais ton stock maintenant pour ne rien manquer !";
          }

          newMessages.push({
            id: `event-${event.id}`,
            text: message,
            type: "alert",
            icon: event.iconEmoji || "📅",
            timestamp: new Date(),
          });
        }
      });
    }

    // Message basé sur le jour de la semaine
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 1 && hour < 12) {
      // Lundi matin
      newMessages.push({
        id: "day-advice",
        text: `📅 C'est lundi ${firstName} ! Début de semaine. Vérifie ton stock et prépare-toi pour une bonne semaine de ventes !`,
        type: "advice",
        icon: "💡",
        timestamp: new Date(),
      });
    } else if (dayOfWeek === 5 && hour > 15) {
      // Vendredi après-midi
      newMessages.push({
        id: "day-advice",
        text: `📅 C'est vendredi ${firstName} ! Bientôt le week-end. As-tu assez de stock pour samedi ?`,
        type: "advice",
        icon: "💡",
        timestamp: new Date(),
      });
    }

    // Conseil de fin de journée
    if (hour >= 17 && hour < 19) {
      newMessages.push({
        id: "end-day",
        text: `🌆 ${firstName}, il est ${hour}h. Bientôt la fermeture. N'oublie pas de compter ta caisse et de ranger tes marchandises en sécurité !`,
        type: "advice",
        icon: "✅",
        timestamp: new Date(),
      });
    }

    // Message de motivation
    if (hour >= 8 && hour < 10 && messages.length === 0) {
      newMessages.push({
        id: "motivation",
        text: `💪 ${firstName}, l'ANSUT croit en toi ! Chaque vente compte. Tu fais un excellent travail pour développer ton commerce !`,
        type: "advice",
        icon: "🌟",
        timestamp: new Date(),
      });
    }

    setMessages(newMessages);
  }, [merchant, user, todayStats, lowStock, weather, marketStats, upcomingEvents]);

  // Rotation automatique des messages
  useEffect(() => {
    if (messages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 10000); // Changer de message toutes les 10 secondes

    return () => clearInterval(interval);
  }, [messages.length]);

  // Synthèse vocale
  const speakMessage = (text: string) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!merchant || messages.length === 0) return null;

  const currentMessage = messages[currentMessageIndex];

  return (
    <>
      {/* Bouton flottant pour ouvrir SUTA */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
        >
          <div className="relative">
            {/* Avatar SUTA */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-green-500 p-1 shadow-2xl animate-bounce">
              <div className="w-full h-full rounded-full bg-white p-1">
                <img
                  src="/suta-avatar-3d.png"
                  alt="SUTA"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>

            {/* Badge de notification */}
            {messages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                {messages.length}
              </div>
            )}

            {/* Icône message */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              Parler avec SUTA
            </div>
          </div>
        </button>
      )}

      {/* Widget SUTA ouvert */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 z-50 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-green-500 p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white p-1">
                <img
                  src="/suta-avatar-3d.png"
                  alt="SUTA"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="text-white">
                <div className="font-bold text-lg">SUTA</div>
                <div className="text-xs opacity-90">Assistant ANSUT</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {/* Message actuel */}
            <div className="bg-gradient-to-br from-orange-50 to-green-50 p-4 rounded-2xl animate-in fade-in duration-500">
              <div className="flex items-start gap-3">
                <div className="text-4xl">{currentMessage.icon}</div>
                <div className="flex-1">
                  <p className="text-gray-800 text-lg leading-relaxed">
                    {currentMessage.text}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speakMessage(currentMessage.text)}
                      className="gap-2"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-4 h-4" />
                          Arrêter
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          Écouter
                        </>
                      )}
                    </Button>
                    <span className="text-xs text-gray-500">
                      {currentMessage.timestamp.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicateur de messages multiples */}
            {messages.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                {messages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMessageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentMessageIndex
                        ? "bg-orange-500 w-6"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 pt-2 border-t">
              💡 SUTA est là pour t'aider 24h/24
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
