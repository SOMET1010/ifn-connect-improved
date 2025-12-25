import { trpc } from "@/lib/trpc";
import { Calendar, Clock, Package, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EventsCalendar() {
  const { data: events = [], isLoading } = trpc.events.getWithRecommendations.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-2xl text-muted-foreground">Chargement des événements...</div>
      </div>
    );
  }

  // Calculer les jours restants
  const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filtrer les événements à venir uniquement
  const upcomingEvents = events.filter((event: any) => getDaysUntil(event.date) >= 0);

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center p-12">
        <Calendar className="w-24 h-24 mx-auto mb-6 text-gray-300" />
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">
          Aucun événement à venir
        </h3>
        <p className="text-lg text-muted-foreground">
          Les prochains événements apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.map((event: any) => {
          const daysUntil = getDaysUntil(event.date);
          const isUrgent = daysUntil <= 7;
          const isSoon = daysUntil <= 30;

          return (
            <Card
              key={event.id}
              className={`transition-all hover:shadow-lg ${
                isUrgent
                  ? "border-red-500 border-2"
                  : isSoon
                  ? "border-orange-500 border-2"
                  : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{event.iconEmoji || "📅"}</div>
                    <div>
                      <CardTitle className="text-xl">{event.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(event.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Countdown */}
                <div
                  className={`flex items-center gap-2 p-4 rounded-lg ${
                    isUrgent
                      ? "bg-red-50 text-red-700"
                      : isSoon
                      ? "bg-orange-50 text-orange-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <Clock className="w-6 h-6" />
                  <div>
                    <div className="font-bold text-2xl">
                      {daysUntil === 0
                        ? "Aujourd'hui !"
                        : daysUntil === 1
                        ? "Demain !"
                        : `Dans ${daysUntil} jours`}
                    </div>
                    {isUrgent && (
                      <div className="text-sm font-medium">⚠️ Prépare ton stock maintenant !</div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}

                {/* Recommandations de stock */}
                {event.recommendations && event.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Package className="w-4 h-4" />
                      Produits recommandés :
                    </div>
                    <div className="space-y-1">
                      {event.recommendations.slice(0, 5).map((rec: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm p-2 rounded bg-gray-50"
                        >
                          <span className="font-medium">{rec.productName}</span>
                          {rec.estimatedDemandIncrease && (
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="w-3 h-3" />
                              <span className="text-xs font-bold">
                                +{rec.estimatedDemandIncrease}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {event.recommendations.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          +{event.recommendations.length - 5} autres produits
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
