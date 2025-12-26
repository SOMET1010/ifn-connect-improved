import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import {
  Users,
  TrendingUp,
  MapPin,
  Plus,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Award,
  BarChart3,
} from 'lucide-react';
import { AgentMap } from '@/components/AgentMap';
import { EnrollmentTrendsChart } from '@/components/EnrollmentTrendsChart';

export default function AgentDashboard() {
  const [, setLocation] = useLocation();
  const [filterMarket, setFilterMarket] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Récupérer toutes les statistiques
  const { data: stats, isLoading: statsLoading } = trpc.agent.stats.useQuery();
  const { data: trends } = trpc.agent.enrollmentTrends.useQuery();
  const { data: socialCoverage } = trpc.agent.socialCoverageStats.useQuery();
  const { data: recentEnrollments } = trpc.agent.recentEnrollments.useQuery({ limit: 5 });
  const { data: enrollmentsByMarket } = trpc.agent.enrollmentsByMarket.useQuery();
  const { data: merchantsByMarket } = trpc.agent.merchantsByMarket.useQuery();

  // Filtrer les marchands selon les critères
  const filteredMerchants = useMemo(() => {
    if (!merchantsByMarket) return {};

    let filtered = { ...merchantsByMarket };

    // Filtrer par marché
    if (filterMarket !== 'all') {
      filtered = { [filterMarket]: filtered[filterMarket] || [] };
    }

    // Filtrer par statut CNPS/CMU
    if (filterStatus !== 'all') {
      const result: Record<string, any[]> = {};
      Object.entries(filtered).forEach(([market, merchants]) => {
        const filteredMerchants = (merchants as any[]).filter((m: any) => {
          if (filterStatus === 'cnps-active') return m.cnpsStatus === 'active';
          if (filterStatus === 'cmu-active') return m.cmuStatus === 'active';
          if (filterStatus === 'no-coverage') return !m.cnpsStatus && !m.cmuStatus;
          return true;
        });
        if (filteredMerchants.length > 0) {
          result[market] = filteredMerchants;
        }
      });
      filtered = result;
    }

    return filtered;
  }, [merchantsByMarket, filterMarket, filterStatus]);

  // Liste des marchés pour le filtre
  const marketNames = useMemo(() => {
    if (!merchantsByMarket) return [];
    return Object.keys(merchantsByMarket).sort();
  }, [merchantsByMarket]);

  // Calculer les pourcentages de couverture sociale
  const totalMerchants = stats?.totalEnrollments || 0;
  const cnpsActivePercent = totalMerchants > 0 
    ? Math.round(((socialCoverage?.cnps.active || 0) / totalMerchants) * 100)
    : 0;
  const cmuActivePercent = totalMerchants > 0
    ? Math.round(((socialCoverage?.cmu.active || 0) / totalMerchants) * 100)
    : 0;

  // Calculer la progression hebdomadaire
  const weeklyGoal = 50; // Objectif hebdomadaire
  const weeklyProgress = stats?.enrollmentsThisMonth 
    ? Math.min(100, Math.round((stats.enrollmentsThisMonth / weeklyGoal) * 100))
    : 0;

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'pending':
        return 'En attente';
      default:
        return 'Non enregistré';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🚀 Dashboard Agent Terrain
              </h1>
              <p className="text-gray-600 text-lg">
                Gestion et suivi des enrôlements marchands
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setLocation('/agent/enrollment')}
              className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg h-14 px-8 text-lg"
            >
              <Plus className="h-6 w-6 mr-2" />
              Nouvel Enrôlement
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Enrôlements du jour */}
          <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <p className="text-2xl text-gray-400">Chargement...</p>
              ) : (
                <>
                  <p className="text-4xl font-bold text-blue-600">
                    {stats?.enrollmentsToday || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">enrôlements</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Enrôlements du mois */}
          <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Ce Mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <p className="text-2xl text-gray-400">Chargement...</p>
              ) : (
                <>
                  <p className="text-4xl font-bold text-green-600">
                    {stats?.enrollmentsThisMonth || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">enrôlements</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total enrôlements */}
          <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <p className="text-2xl text-gray-400">Chargement...</p>
              ) : (
                <>
                  <p className="text-4xl font-bold text-purple-600">
                    {stats?.totalEnrollments || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">marchands</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Marchés couverts */}
          <Card className="border-2 border-orange-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                Marchés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <p className="text-2xl text-gray-400">Chargement...</p>
              ) : (
                <>
                  <p className="text-4xl font-bold text-orange-600">
                    {stats?.marketsCovered || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">couverts</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Graphique de tendances */}
        <div className="mb-8">
          <EnrollmentTrendsChart data={trends || []} />
        </div>

        {/* Couverture sociale et Répartition par marché */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Couverture sociale */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600" />
                Couverture Sociale
              </CardTitle>
              <CardDescription>
                Répartition CNPS et CMU des marchands enrôlés
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* CNPS */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">CNPS (Retraite)</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {cnpsActivePercent}% actifs
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Actifs
                      </span>
                      <span className="font-bold text-green-600">
                        {socialCoverage?.cnps.active || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        En attente
                      </span>
                      <span className="font-bold text-yellow-600">
                        {socialCoverage?.cnps.pending || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Inactifs
                      </span>
                      <span className="font-bold text-red-600">
                        {socialCoverage?.cnps.inactive || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-gray-400" />
                        Non enregistrés
                      </span>
                      <span className="font-bold text-gray-600">
                        {socialCoverage?.cnps.none || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CMU */}
                <div className="pt-6 border-t-2 border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">CMU (Santé)</h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {cmuActivePercent}% actifs
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Actifs
                      </span>
                      <span className="font-bold text-green-600">
                        {socialCoverage?.cmu.active || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        En attente
                      </span>
                      <span className="font-bold text-yellow-600">
                        {socialCoverage?.cmu.pending || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Inactifs
                      </span>
                      <span className="font-bold text-red-600">
                        {socialCoverage?.cmu.inactive || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-gray-400" />
                        Non enregistrés
                      </span>
                      <span className="font-bold text-gray-600">
                        {socialCoverage?.cmu.none || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Répartition par marché */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-orange-600" />
                Répartition par Marché
              </CardTitle>
              <CardDescription>
                Top 5 des marchés avec le plus d'enrôlements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {enrollmentsByMarket && enrollmentsByMarket.length > 0 ? (
                <div className="space-y-4">
                  {enrollmentsByMarket.slice(0, 5).map((market, index) => {
                    const maxCount = enrollmentsByMarket[0]?.count || 1;
                    const percentage = Math.round((market.count / maxCount) * 100);
                    
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {market.marketName || 'Marché inconnu'}
                          </span>
                          <span className="text-sm font-bold text-orange-600">
                            {market.count} marchand{market.count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carte interactive */}
        <div className="mb-8">
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="flex items-center gap-3 mb-2">
                    <MapPin className="h-6 w-6 text-green-600" />
                    Carte Interactive des Marchands
                  </CardTitle>
                  <CardDescription>
                    Visualisation géographique avec clustering intelligent
                  </CardDescription>
                </div>
              </div>

              {/* Filtres */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Filtrer par marché
                  </label>
                  <select
                    value={filterMarket}
                    onChange={(e) => setFilterMarket(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none bg-white"
                  >
                    <option value="all">Tous les marchés</option>
                    {marketNames.map(market => (
                      <option key={market} value={market}>{market}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Filtrer par couverture sociale
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none bg-white"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="cnps-active">CNPS actif</option>
                    <option value="cmu-active">CMU actif</option>
                    <option value="no-coverage">Sans couverture</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[600px] rounded-lg overflow-hidden border-2 border-gray-200">
                <AgentMap merchants={filteredMerchants} />
              </div>
              
              {/* Compteur de marchands filtrés */}
              <div className="mt-4 text-center text-sm text-gray-600">
                {Object.values(filteredMerchants).flat().length} marchand(s) affiché(s)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrôlements récents */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-purple-600" />
              Enrôlements Récents
            </CardTitle>
            <CardDescription>
              Les 5 derniers marchands enrôlés
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {recentEnrollments && recentEnrollments.length > 0 ? (
              <div className="space-y-4">
                {recentEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {enrollment.businessName || 'Commerce'}
                        </h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {enrollment.merchantNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {enrollment.userName}
                        </span>
                        <span>{enrollment.phone}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {enrollment.marketName || 'Marché inconnu'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(enrollment.cnpsStatus)}
                          <span className="text-sm text-gray-600">CNPS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(enrollment.cmuStatus)}
                          <span className="text-sm text-gray-600">CMU</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {enrollment.enrolledAt
                            ? new Date(enrollment.enrolledAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {enrollment.enrolledAt
                            ? new Date(enrollment.enrolledAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg">Aucun enrôlement récent</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
