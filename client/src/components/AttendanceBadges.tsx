import { trpc } from "@/lib/trpc";
import { Award, Calendar, Clock, Flame, Star, TrendingUp, Trophy } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requirement: string;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "streak_7",
    name: "Série de 7 jours",
    description: "7 jours consécutifs travaillés",
    icon: <Flame className="h-8 w-8" />,
    color: "from-orange-500 to-red-500",
    requirement: "Travaillez 7 jours d'affilée",
  },
  {
    id: "streak_30",
    name: "Série de 30 jours",
    description: "30 jours consécutifs travaillés",
    icon: <Flame className="h-8 w-8" />,
    color: "from-red-500 to-pink-500",
    requirement: "Travaillez 30 jours d'affilée",
  },
  {
    id: "month_20",
    name: "Mois productif",
    description: "20 jours travaillés ce mois",
    icon: <Calendar className="h-8 w-8" />,
    color: "from-blue-500 to-cyan-500",
    requirement: "Travaillez 20 jours dans le mois",
  },
  {
    id: "month_30",
    name: "Mois complet",
    description: "30 jours travaillés ce mois",
    icon: <Calendar className="h-8 w-8" />,
    color: "from-purple-500 to-pink-500",
    requirement: "Travaillez tous les jours du mois",
  },
  {
    id: "early_bird",
    name: "Lève-tôt",
    description: "20 ouvertures avant 10h",
    icon: <Clock className="h-8 w-8" />,
    color: "from-yellow-500 to-orange-500",
    requirement: "Ouvrez avant 10h pendant 20 jours",
  },
  {
    id: "regular",
    name: "Régulier",
    description: "25 jours travaillés sur 30",
    icon: <TrendingUp className="h-8 w-8" />,
    color: "from-green-500 to-emerald-500",
    requirement: "Travaillez 25 jours sur les 30 derniers",
  },
  {
    id: "champion",
    name: "Champion",
    description: "60 jours consécutifs travaillés",
    icon: <Trophy className="h-8 w-8" />,
    color: "from-yellow-400 to-yellow-600",
    requirement: "Travaillez 60 jours d'affilée",
  },
];

export function AttendanceBadges() {
  const { data, isLoading } = trpc.attendanceBadges.getMyBadges.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-24 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const unlockedBadges = data?.badges || {};
  const stats = data?.stats || {
    currentStreak: 0,
    longestStreak: 0,
    daysThisMonth: 0,
    earlyOpenings: 0,
    last30Days: 0,
    last7Days: 0,
  };

  return (
    <div className="space-y-6">
      {/* Statistiques d'assiduité */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Série actuelle</div>
          <div className="text-3xl font-bold text-orange-600 flex items-center gap-2">
            <Flame className="h-6 w-6" />
            {stats.currentStreak || 0}
          </div>
          <div className="text-xs text-gray-500">jours consécutifs</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Meilleure série</div>
          <div className="text-3xl font-bold text-purple-600 flex items-center gap-2">
            <Star className="h-6 w-6" />
            {stats.longestStreak || 0}
          </div>
          <div className="text-xs text-gray-500">jours consécutifs</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Ce mois-ci</div>
          <div className="text-3xl font-bold text-blue-600 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            {stats.daysThisMonth || 0}
          </div>
          <div className="text-xs text-gray-500">jours travaillés</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Lève-tôt</div>
          <div className="text-3xl font-bold text-yellow-600 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            {stats.earlyOpenings || 0}
          </div>
          <div className="text-xs text-gray-500">avant 10h (30j)</div>
        </Card>
      </div>

      {/* Badges */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award className="h-6 w-6 text-orange-600" />
          Badges d'assiduité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGE_DEFINITIONS.map((badge) => {
            const isUnlocked = unlockedBadges[badge.id as keyof typeof unlockedBadges];

            return (
              <Card
                key={badge.id}
                className={`p-6 transition-all ${
                  isUnlocked
                    ? "bg-gradient-to-br " + badge.color + " text-white shadow-lg"
                    : "bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      isUnlocked ? "bg-white/20" : "bg-gray-200"
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-lg">{badge.name}</h4>
                      {isUnlocked && (
                        <Badge className="bg-white/20 text-white border-white/30">
                          Débloqué
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${isUnlocked ? "text-white/90" : "text-gray-600"}`}>
                      {badge.description}
                    </p>
                    {!isUnlocked && (
                      <p className="text-xs text-gray-500 mt-2">{badge.requirement}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Message d'encouragement */}
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
        <div className="flex items-start gap-4">
          <Trophy className="h-8 w-8 text-orange-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-lg mb-2">Continuez comme ça !</h4>
            <p className="text-gray-700">
              {stats.currentStreak >= 7
                ? `Incroyable ! Vous avez une série de ${stats.currentStreak} jours. Continuez pour débloquer plus de badges !`
                : stats.currentStreak > 0
                ? `Vous avez une série de ${stats.currentStreak} jours. Encore ${7 - stats.currentStreak} jours pour débloquer le badge "Série de 7 jours" !`
                : "Commencez votre série dès aujourd'hui en ouvrant votre journée !"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
