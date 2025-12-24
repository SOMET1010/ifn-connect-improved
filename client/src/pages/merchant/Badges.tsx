import { useLocation } from 'wouter';
import { ArrowLeft, Lock, CheckCircle, Trophy } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import InstitutionalHeader from '@/components/InstitutionalHeader';

/**
 * Page des Badges - Gamification
 * Affiche tous les badges disponibles et ceux débloqués par le marchand
 */
export default function Badges() {
  const [, setLocation] = useLocation();
  const { merchant } = useAuth();

  // Récupérer tous les badges
  const { data: allBadges, isLoading: badgesLoading } = trpc.badges.list.useQuery();
  
  // Récupérer les badges du marchand
  const { data: merchantBadges, isLoading: merchantBadgesLoading } = trpc.badges.myBadges.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <InstitutionalHeader />
        <div className="container mx-auto px-4 py-8">
          <p className="text-3xl text-center text-red-600">Marchand non trouvé</p>
        </div>
      </div>
    );
  }

  if (badgesLoading || merchantBadgesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <InstitutionalHeader />
        <div className="container mx-auto px-4 py-8">
          <p className="text-4xl text-center">Chargement...</p>
        </div>
      </div>
    );
  }

  const unlockedBadgeIds = new Set(merchantBadges?.map(mb => mb.badgeId) || []);
  const unlockedCount = unlockedBadgeIds.size;
  const totalCount = allBadges?.length || 0;
  const totalPoints = merchantBadges?.reduce((sum, mb) => {
    const badge = allBadges?.find(b => b.id === mb.badgeId);
    return sum + (badge?.points || 0);
  }, 0) || 0;

  // Grouper les badges par catégorie
  type BadgeType = NonNullable<typeof allBadges>[number];
  const badgesByCategory = allBadges?.reduce((acc: Record<string, BadgeType[]>, badge: BadgeType) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof allBadges>) || {};

  const categoryNames: Record<string, string> = {
    sales: "💰 Ventes",
    stock: "📦 Stock",
    social: "🛡️ Protection Sociale",
    learning: "📚 Apprentissage",
    community: "🤝 Communauté",
    achievement: "🏆 Accomplissements",
  };

  const categoryColors: Record<string, string> = {
    sales: "from-yellow-400 to-yellow-500",
    stock: "from-blue-400 to-blue-500",
    social: "from-green-400 to-green-500",
    learning: "from-purple-400 to-purple-500",
    community: "from-orange-400 to-orange-500",
    achievement: "from-pink-400 to-pink-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      <InstitutionalHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Bouton retour */}
        <button
          onClick={() => setLocation('/merchant/profile')}
          className="mb-8 bg-gray-200 hover:bg-gray-300 rounded-2xl px-8 py-6 flex items-center gap-4 text-3xl font-bold text-gray-700 transition-all hover:scale-105"
        >
          <ArrowLeft className="w-12 h-12" />
          Retour au Profil
        </button>

        {/* Titre et statistiques */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            🏆 Mes Badges
          </h1>
          <p className="text-3xl text-gray-700 mb-8">
            Débloquez des badges en accomplissant des défis !
          </p>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl p-10 text-white shadow-2xl">
              <Trophy className="w-20 h-20 mx-auto mb-4" />
              <p className="text-2xl mb-2">Badges Débloqués</p>
              <p className="text-7xl font-bold">{unlockedCount}/{totalCount}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-3xl p-10 text-white shadow-2xl">
              <CheckCircle className="w-20 h-20 mx-auto mb-4" />
              <p className="text-2xl mb-2">Progression</p>
              <p className="text-7xl font-bold">{totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%</p>
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl p-10 text-white shadow-2xl">
              <Trophy className="w-20 h-20 mx-auto mb-4" />
              <p className="text-2xl mb-2">Points Totaux</p>
              <p className="text-7xl font-bold">{totalPoints}</p>
            </div>
          </div>
        </div>

        {/* Badges par catégorie */}
        {Object.entries(badgesByCategory).map(([category, badges]) => (
          <div key={category} className="mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-8">
              {categoryNames[category] || category}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(badges as BadgeType[]).map((badge: BadgeType) => {
                const isUnlocked = unlockedBadgeIds.has(badge.id);
                
                return (
                  <div
                    key={badge.id}
                    className={`rounded-3xl p-10 shadow-2xl transition-all ${
                      isUnlocked
                        ? `bg-gradient-to-br ${categoryColors[category]} text-white`
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {/* Icône du badge */}
                    <div className="flex items-center justify-center mb-6">
                      {isUnlocked ? (
                        <div className="text-9xl">{badge.icon}</div>
                      ) : (
                        <div className="bg-gray-300 rounded-full p-8">
                          <Lock className="w-24 h-24 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Nom et description */}
                    <h3 className="text-4xl font-bold text-center mb-4">
                      {badge.name}
                    </h3>
                    <p className={`text-2xl text-center mb-6 ${isUnlocked ? 'text-white/90' : 'text-gray-600'}`}>
                      {badge.description}
                    </p>

                    {/* Condition */}
                    <div className={`rounded-2xl p-6 text-center ${
                      isUnlocked ? 'bg-white/20' : 'bg-gray-300'
                    }`}>
                      <p className="text-xl mb-2">Condition</p>
                      <p className={`text-2xl font-bold ${isUnlocked ? 'text-white' : 'text-gray-700'}`}>
                        {badge.requirement}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="mt-6 text-center">
                      <span className={`inline-block px-6 py-3 rounded-full text-2xl font-bold ${
                        isUnlocked ? 'bg-white/30 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        +{badge.points} points
                      </span>
                    </div>

                    {/* Statut */}
                    {isUnlocked && (
                      <div className="mt-6 flex items-center justify-center gap-3">
                        <CheckCircle className="w-10 h-10" />
                        <span className="text-2xl font-bold">Débloqué !</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Message d'encouragement */}
        {unlockedCount < totalCount && (
          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-purple-400 to-purple-500 rounded-3xl p-12 shadow-2xl text-white">
              <p className="text-5xl font-bold mb-4">
                💪 Continue comme ça !
              </p>
              <p className="text-3xl">
                Il te reste {totalCount - unlockedCount} badge{totalCount - unlockedCount > 1 ? 's' : ''} à débloquer
              </p>
            </div>
          </div>
        )}

        {/* Message de félicitations si tous débloqués */}
        {unlockedCount === totalCount && totalCount > 0 && (
          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-3xl p-12 shadow-2xl text-white">
              <p className="text-7xl mb-6">🎉</p>
              <p className="text-5xl font-bold mb-4">
                Félicitations !
              </p>
              <p className="text-3xl">
                Tu as débloqué TOUS les badges ! 🏆
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
