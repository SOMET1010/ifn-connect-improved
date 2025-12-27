import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { Calendar, Clock, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SessionsChart, { ComparisonCard } from '@/components/SessionsChart';

/**
 * Page Historique des Sessions
 * Affiche un calendrier des jours travaillés et les statistiques de sessions
 */
export default function SessionsHistory() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;

  const { data: historyData, isLoading } = trpc.dailySessions.getHistory.useQuery(
    { merchantId: merchantId!, limit: 30 },
    { enabled: !!merchantId }
  );

  // Charger les statistiques d'évolution
  const { data: last30DaysStats } = trpc.dailySessions.getLast30DaysStats.useQuery(
    undefined,
    { enabled: !!merchantId }
  );

  const { data: weekComparison } = trpc.dailySessions.compareWeeks.useQuery(
    undefined,
    { enabled: !!merchantId }
  );

  const { data: monthComparison } = trpc.dailySessions.compareMonths.useQuery(
    undefined,
    { enabled: !!merchantId }
  );

  if (!merchantId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstitutionalHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Chargement...</p>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstitutionalHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Chargement de l'historique...</p>
        </main>
      </div>
    );
  }

  const sessions = historyData?.sessions || [];
  const stats = historyData?.stats || {
    totalDaysWorked: 0,
    averageDuration: 0,
    longestDay: null,
  };

  // Grouper les sessions par mois
  const sessionsByMonth = sessions.reduce((acc: Record<string, typeof sessions>, session) => {
    const date = new Date(session.sessionDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(session);
    return acc;
  }, {});

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPENED':
        return <Badge className="bg-green-600">Ouverte</Badge>;
      case 'CLOSED':
        return <Badge className="bg-gray-600">Fermée</Badge>;
      case 'NOT_OPENED':
        return <Badge variant="outline">Non ouverte</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <InstitutionalHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Calendar className="h-10 w-10 text-orange-600" />
            Historique des Sessions
          </h1>
          <p className="text-lg text-gray-600">
            Consultez votre calendrier de travail et vos statistiques
          </p>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Jours travaillés */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Jours travaillés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalDaysWorked}</p>
                  <p className="text-sm text-gray-500">sur 30 derniers jours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Durée moyenne */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Durée moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.averageDuration > 0 ? formatDuration(stats.averageDuration) : '0h'}
                  </p>
                  <p className="text-sm text-gray-500">par jour</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Journée la plus longue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Record</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  {stats.longestDay ? (
                    <>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatDuration(stats.longestDay.duration)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(stats.longestDay.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-400">-</p>
                      <p className="text-sm text-gray-500">Aucune session</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique d'évolution */}
        {last30DaysStats && last30DaysStats.length > 0 && (
          <SessionsChart 
            data={last30DaysStats}
            title="Évolution des heures travaillées"
            description="Vos 7 derniers jours de travail"
          />
        )}

        {/* Comparaisons semaine et mois */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {weekComparison && (
            <ComparisonCard
              title="Comparaison hebdomadaire"
              currentValue={weekComparison.thisWeek.totalHours}
              previousValue={weekComparison.lastWeek.totalHours}
              currentLabel="Cette semaine"
              previousLabel="Semaine dernière"
            />
          )}

          {monthComparison && (
            <ComparisonCard
              title="Comparaison mensuelle"
              currentValue={monthComparison.thisMonth.totalHours}
              previousValue={monthComparison.lastMonth.totalHours}
              currentLabel="Ce mois"
              previousLabel="Mois dernier"
            />
          )}
        </div>

        {/* Calendrier des sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Calendrier des 30 derniers jours</CardTitle>
            <CardDescription>
              Vos sessions d'ouverture et de fermeture de journée
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune session enregistrée</p>
                <p className="text-gray-400 text-sm mt-2">
                  Commencez par ouvrir votre journée depuis le dashboard
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(sessionsByMonth)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([monthKey, monthSessions]) => {
                    const [year, month] = monthKey.split('-');
                    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric',
                    });

                    return (
                      <div key={monthKey}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                          {monthName}
                        </h3>
                        <div className="space-y-3">
                          {monthSessions
                            .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
                            .map((session) => {
                              const date = new Date(session.sessionDate);
                              const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
                              const dayNumber = date.getDate();

                              return (
                                <div
                                  key={session.id}
                                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <p className="text-2xl font-bold text-gray-900">{dayNumber}</p>
                                      <p className="text-xs text-gray-500 capitalize">{dayName}</p>
                                    </div>
                                    <div>
                                      {getStatusBadge(session.status)}
                                      {session.duration && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          Durée : {formatDuration(session.duration)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {session.openedAt && (
                                      <p className="text-sm text-gray-600">
                                        Ouvert à{' '}
                                        {new Date(session.openedAt).toLocaleTimeString('fr-FR', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    )}
                                    {session.closedAt && (
                                      <p className="text-sm text-gray-600">
                                        Fermé à{' '}
                                        {new Date(session.closedAt).toLocaleTimeString('fr-FR', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
