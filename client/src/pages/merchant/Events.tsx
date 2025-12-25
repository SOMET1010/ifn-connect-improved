import { EventsCalendar } from "@/components/EventsCalendar";
import { Calendar } from "lucide-react";

export default function Events() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
          <Calendar className="w-12 h-12 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            📅 Calendrier des Événements
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Prépare ton stock pour les fêtes et événements importants
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-3xl">💡</div>
          <div>
            <h3 className="font-semibold text-lg text-blue-900 mb-2">
              Pourquoi c'est important ?
            </h3>
            <p className="text-blue-800">
              Les événements comme le Ramadan, la Tabaski, Noël et la Rentrée scolaire 
              augmentent la demande de certains produits. En te préparant à l'avance, 
              tu peux augmenter tes ventes et éviter les ruptures de stock !
            </p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <EventsCalendar />

      {/* Legend */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-4">Légende :</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">
              <strong>Urgent</strong> - Dans 7 jours ou moins
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm">
              <strong>Bientôt</strong> - Dans 30 jours ou moins
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">
              <strong>À venir</strong> - Plus de 30 jours
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
