import { useState, useEffect, useRef } from "react";
import { X, Volume2, VolumeX, MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { generateContextualMessages } from "@/lib/contextual-messages";
import type { WeatherCondition, MerchantContext } from "@/lib/contextual-messages";

interface CopilotMessage {
  id: string;
  text: string;
  type: "greeting" | "stats" | "alert" | "advice" | "weather" | "market";
  icon?: string;
  timestamp: Date;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function CopilotAssistantContent() {
  const { user, merchant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Récupérer les statistiques du marchand
  const { data: todayStats } = trpc.sales.todayStats.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant, refetchInterval: 60000 }
  );

  // Récupérer le stock bas
  const { data: lowStock } = trpc.stock.lowStock.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  // Récupérer la météo
  const { data: weather } = trpc.copilot.weather.useQuery(
    undefined,
    { enabled: !!merchant, refetchInterval: 300000 }
  );

  // Récupérer les stats du marché
  const { data: marketStats } = trpc.copilot.marketStats.useQuery(
    undefined,
    { enabled: !!merchant, refetchInterval: 120000 }
  );

  // Récupérer les événements à venir
  const { data: upcomingEvents } = trpc.events.getWithRecommendations.useQuery(
    undefined,
    { enabled: !!merchant, refetchInterval: 3600000 }
  );

  // Mutation pour envoyer un message au chat
  const sendChatMessage = trpc.copilotChat.sendMessage.useMutation({
    onSuccess: (data) => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: String(data.message),
          timestamp: data.timestamp,
        },
      ]);
      setIsLoadingChat(false);
    },
    onError: () => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "😔 Désolé, j'ai un problème technique. Réessaye dans quelques instants !",
          timestamp: new Date(),
        },
      ]);
      setIsLoadingChat(false);
    },
  });

  // Générer les messages personnalisés
  useEffect(() => {
    if (!merchant || !user) return;

    const newMessages: CopilotMessage[] = [];
    const firstName = user.name?.split(" ")[0] || "Ami(e)";

    // Préparer le contexte marchand
    const merchantContext: MerchantContext = {
      firstName,
      salesCount: todayStats?.salesCount || 0,
      totalSales: parseFloat(String(todayStats?.totalSales || "0")),
      lowStockCount: lowStock?.length || 0,
    };

    // Générer les messages contextuels enrichis
    const contextualMessages = generateContextualMessages(
      weather as WeatherCondition | undefined,
      merchantContext
    );

    // Ajouter les messages contextuels
    contextualMessages.forEach((msg) => {
      newMessages.push({
        id: msg.id,
        text: msg.text,
        type: msg.type as any,
        icon: msg.icon,
        timestamp: new Date(),
      });
    });

    // Alertes stock bas
    if (lowStock && lowStock.length > 0) {
      newMessages.push({
        id: "stock-alert",
        text: `⚠️ ${firstName}, tu as ${lowStock.length} produit${lowStock.length > 1 ? "s" : ""} en stock bas ! Pense à réapprovisionner.`,
        type: "alert",
        icon: "📦",
        timestamp: new Date(),
      });
    }

    // Événements à venir
    if (upcomingEvents && upcomingEvents.length > 0) {
      const nextEvent = upcomingEvents[0];
      const daysUntil = Math.ceil(
        (new Date(nextEvent.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 7) {
        newMessages.push({
          id: "event-alert",
          text: `🎉 ${firstName}, ${nextEvent.name} arrive dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""} ! Prépare ton stock.`,
          type: "advice",
          icon: "📅",
          timestamp: new Date(),
        });
      }
    }

    setMessages(newMessages);
  }, [merchant, user, todayStats, lowStock, weather, marketStats, upcomingEvents]);

  // Rotation automatique des messages
  useEffect(() => {
    if (messages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoadingChat) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setIsLoadingChat(true);

    // Ajouter le message utilisateur
    setChatMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    // Envoyer au backend
    await sendChatMessage.mutateAsync({
      message: userMessage,
      conversationHistory: chatMessages,
    });
  };

  // Scroll automatique vers le dernier message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  // Vérifier les conditions APRÈS tous les hooks
  if (!merchant || messages.length === 0) return null;

  const currentMessage = messages[currentMessageIndex];

  return (
    <>
      {/* Bouton flottant pour ouvrir SUTA */}
      {!isOpen && (
        <button aria-label="Ouvrir l'assistant SUTA"
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
          {/* Header sobre */}
          <div className="bg-white border-b border-gray-200 p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 p-1">
                <img
                  src="/suta-avatar-3d.png"
                  alt="SUTA"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <div className="font-semibold text-gray-900">SUTA</div>
                <div className="text-xs text-gray-500">Assistant ANSUT</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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
                  <button aria-label="Naviguer vers le message"
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

            {/* Historique du chat */}
            {chatMessages.length > 0 && (
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto border-t pt-4">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {msg.timestamp.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Champ de saisie du chat */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Pose ta question à SUTA..."
                  disabled={isLoadingChat}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                />
                <button aria-label="Envoyer le message"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isLoadingChat}
                  className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingChat ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 SUTA est là pour t'aider 24h/24
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

export function CopilotAssistant() {
  return <CopilotAssistantContent />;
}
