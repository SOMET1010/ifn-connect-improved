import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';

/**
 * Composant de graphiques de statistiques de sessions
 * Affiche les tendances des 30 derniers jours et les comparaisons hebdo/mensuelles
 */
export function SessionStatsChart() {
  const { data: last30Days = [], isLoading: loadingLast30 } = trpc.dailySessions.getLast30DaysStats.useQuery();
  const { data: weekComparison, isLoading: loadingWeek } = trpc.dailySessions.compareWeeks.useQuery();
  const { data: monthComparison, isLoading: loadingMonth } = trpc.dailySessions.compareMonths.useQuery();

  // Calculer les statistiques agrégées
  const totalHoursLast30 = useMemo(() => {
    return last30Days.reduce((sum, day) => sum + day.hoursWorked, 0);
  }, [last30Days]);

  const avgHoursPerDay = useMemo(() => {
    if (last30Days.length === 0) return 0;
    return totalHoursLast30 / last30Days.length;
  }, [totalHoursLast30, last30Days.length]);

  // Trouver le maximum pour normaliser les barres
  const maxHours = useMemo(() => {
    return Math.max(...last30Days.map(d => d.hoursWorked), 1);
  }, [last30Days]);

  if (loadingLast30 || loadingWeek || loadingMonth) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graphique des 30 derniers jours */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Heures travaillées (30 derniers jours)</h3>
            <p className="text-sm text-gray-500 mt-1">
              Total : <span className="font-bold text-orange-600">{totalHoursLast30.toFixed(1)}h</span> • 
              Moyenne : <span className="font-bold text-orange-600">{avgHoursPerDay.toFixed(1)}h/jour</span>
            </p>
          </div>
          <Calendar className="w-6 h-6 text-orange-500" />
        </div>

        {/* Graphique en barres */}
        <div className="relative h-48">
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {last30Days.map((day, index) => {
              const heightPercent = (day.hoursWorked / maxHours) * 100;
              const date = new Date(day.date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative">
                  {/* Barre */}
                  <div
                    className={`w-full rounded-t transition-all ${
                      isToday 
                        ? 'bg-orange-500' 
                        : day.hoursWorked > 0 
                          ? 'bg-orange-300 hover:bg-orange-400' 
                          : 'bg-gray-200'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  
                  {/* Tooltip au survol */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                    <div className="font-bold">{date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                    <div>{day.hoursWorked.toFixed(1)}h</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Légende */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-300 rounded"></div>
            <span>Jour travaillé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Aujourd'hui</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Jour fermé</span>
          </div>
        </div>
      </Card>

      {/* Comparaisons hebdomadaire et mensuelle */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Comparaison hebdomadaire */}
        {weekComparison && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cette semaine</h3>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {weekComparison.thisWeek.totalHours}h
                  </span>
                  <span className="text-sm text-gray-500">
                    ({weekComparison.thisWeek.daysWorked} jours)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {weekComparison.difference.percentage >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-green-600">
                      +{weekComparison.difference.percentage}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-600">
                      {weekComparison.difference.percentage}%
                    </span>
                  </>
                )}
                <span className="text-gray-500">vs semaine dernière</span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Semaine dernière : <span className="font-semibold text-gray-700">{weekComparison.lastWeek.totalHours}h</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Comparaison mensuelle */}
        {monthComparison && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ce mois-ci</h3>
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {monthComparison.thisMonth.totalHours}h
                  </span>
                  <span className="text-sm text-gray-500">
                    ({monthComparison.thisMonth.daysWorked} jours)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {monthComparison.difference.percentage >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-green-600">
                      +{monthComparison.difference.percentage}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-600">
                      {monthComparison.difference.percentage}%
                    </span>
                  </>
                )}
                <span className="text-gray-500">vs mois dernier</span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Mois dernier : <span className="font-semibold text-gray-700">{monthComparison.lastMonth.totalHours}h</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
