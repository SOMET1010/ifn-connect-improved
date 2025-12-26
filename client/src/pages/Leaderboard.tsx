import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trophy, Medal, Award, TrendingUp, Users, Target } from 'lucide-react';
import { useState } from 'react';

export default function Leaderboard() {
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(undefined);
  
  const { data: regions } = trpc.leaderboard.getRegions.useQuery();
  const { data: ranking, isLoading } = trpc.leaderboard.getRegionalRanking.useQuery({
    region: selectedRegion,
  });
  const { data: myRank } = trpc.leaderboard.getMyRank.useQuery({});
  const { data: globalStats } = trpc.leaderboard.getGlobalStats.useQuery();

  const getPodiumIcon = (rank: number | null) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />;
    return null;
  };

  const getPodiumBg = (rank: number | null) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300';
    if (rank === 2) return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300';
    if (rank === 3) return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300';
    return 'bg-white border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Chargement du classement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-900">Classement Hebdomadaire</h1>
        </div>
        <p className="text-gray-600">
          Compétition amicale entre marchands - Semaine en cours
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {globalStats?.totalParticipants || 0}
                </p>
                <p className="text-sm text-gray-600">Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {globalStats?.totalQuizzes || 0}
                </p>
                <p className="text-sm text-gray-600">Quiz complétés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(globalStats?.averageScore || 0)}%
                </p>
                <p className="text-sm text-gray-600">Score moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ma position */}
      {myRank && (
        <Card className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              Ma Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rang</p>
                <p className="text-2xl font-bold text-indigo-600">#{myRank.rank}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Points</p>
                <p className="text-2xl font-bold text-gray-900">{myRank.totalPoints}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Quiz</p>
                <p className="text-2xl font-bold text-gray-900">{myRank.quizzesCompleted}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Moyenne</p>
                <p className="text-2xl font-bold text-gray-900">{myRank.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtrer par région</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedRegion === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRegion(undefined)}
            >
              Toutes les régions
            </Button>
            {regions?.map((region) => (
              <Button
                key={region}
                variant={selectedRegion === region ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRegion(region)}
              >
                {region}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Classement */}
      <Card>
        <CardHeader>
          <CardTitle>Top 50 - {selectedRegion || 'Toutes les régions'}</CardTitle>
          <CardDescription>
            Les meilleurs marchands de la semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ranking || ranking.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun participant pour le moment</p>
              <p className="text-sm text-gray-500 mt-2">
                Soyez le premier à terminer un quiz cette semaine !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${getPodiumBg(
                    entry.rank
                  )}`}
                >
                  {/* Rang */}
                  <div className="flex-shrink-0 w-16 text-center">
                    {entry.rank && entry.rank <= 3 ? (
                      <div className="flex justify-center">{getPodiumIcon(entry.rank)}</div>
                    ) : (
                      <span className="text-2xl font-bold text-gray-600">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Nom */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {entry.userName || 'Marchand'}
                    </p>
                    <p className="text-sm text-gray-600">{entry.region}</p>
                  </div>

                  {/* Statistiques */}
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{entry.totalPoints}</p>
                      <p className="text-xs text-gray-600">Points</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{entry.quizzesCompleted}</p>
                      <p className="text-xs text-gray-600">Quiz</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-indigo-600">{entry.averageScore}%</p>
                      <p className="text-xs text-gray-600">Moyenne</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Récompenses */}
      <Card className="mt-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Récompenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="font-semibold text-gray-900">🥇 1ère place</p>
                <p className="text-sm text-gray-600">
                  Visibilité gratuite 24h sur la page d'accueil
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Medal className="h-6 w-6 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-900">🥈 2ème place</p>
                <p className="text-sm text-gray-600">Badge spécial "Vice-Champion"</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Medal className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-semibold text-gray-900">🥉 3ème place</p>
                <p className="text-sm text-gray-600">Badge spécial "Top 3"</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
