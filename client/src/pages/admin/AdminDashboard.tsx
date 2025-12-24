import { trpc } from '@/lib/trpc';
import { Users, TrendingUp, Shield, Activity, AlertTriangle, UserX } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';

/**
 * Dashboard Admin DGE/ANSUT
 * Supervision nationale avec indicateurs clés
 */
export default function AdminDashboard() {
  // Récupérer les statistiques globales
  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
  const { data: merchantsWithAlerts = [] } = trpc.admin.getMerchantsWithAlerts.useQuery();
  const { data: inactiveMerchants = [] } = trpc.admin.getInactiveMerchants.useQuery();
  const { data: marketDistribution = [] } = trpc.admin.getMarketDistribution.useQuery();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-4xl font-bold text-gray-700">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header institutionnel */}
      <InstitutionalHeader />

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-12">
        
        {/* Titre */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Dashboard DGE/ANSUT 📊
          </h1>
          <p className="text-3xl text-gray-700">
            Supervision Nationale - Inclusion Financière Numérique
          </p>
        </div>

        {/* 4 GRANDES CARTES KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          
          {/* KPI 1 : Nombre total de marchands */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-10 shadow-2xl text-white">
            <div className="flex items-center gap-4 mb-4">
              <Users className="w-16 h-16" strokeWidth={2.5} />
              <h2 className="text-2xl font-bold">Marchands</h2>
            </div>
            <p className="text-6xl font-bold mb-2">{stats?.totalMerchants?.toLocaleString() || 0}</p>
            <p className="text-xl text-blue-100">Enrôlés</p>
          </div>

          {/* KPI 2 : Volume total des transactions */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-10 shadow-2xl text-white">
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp className="w-16 h-16" strokeWidth={2.5} />
              <h2 className="text-2xl font-bold">Volume</h2>
            </div>
            <p className="text-5xl font-bold mb-2">{(stats?.totalVolume || 0).toLocaleString()}</p>
            <p className="text-xl text-green-100">FCFA</p>
            <p className="text-sm text-green-100 mt-2">{stats?.totalTransactions?.toLocaleString() || 0} transactions</p>
          </div>

          {/* KPI 3 : Taux de couverture sociale */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-10 shadow-2xl text-white">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-16 h-16" strokeWidth={2.5} />
              <h2 className="text-2xl font-bold">Couverture</h2>
            </div>
            <p className="text-6xl font-bold mb-2">{stats?.coverageRate?.toFixed(1) || 0}%</p>
            <p className="text-xl text-purple-100">CNPS + CMU</p>
            <p className="text-sm text-purple-100 mt-2">{stats?.coveredMerchants || 0} marchands couverts</p>
          </div>

          {/* KPI 4 : Taux d'adoption */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-10 shadow-2xl text-white">
            <div className="flex items-center gap-4 mb-4">
              <Activity className="w-16 h-16" strokeWidth={2.5} />
              <h2 className="text-2xl font-bold">Adoption</h2>
            </div>
            <p className="text-6xl font-bold mb-2">{stats?.adoptionRate?.toFixed(1) || 0}%</p>
            <p className="text-xl text-orange-100">Actifs 30j</p>
            <p className="text-sm text-orange-100 mt-2">{stats?.activeMerchants || 0} marchands actifs</p>
          </div>
        </div>

        {/* SECTION ALERTES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* Alertes CNPS/CMU */}
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Alertes Couverture Sociale</h2>
                <p className="text-xl text-gray-600">Expirations &lt; 30 jours</p>
              </div>
            </div>

            {merchantsWithAlerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl text-gray-500">✅ Aucune alerte</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {merchantsWithAlerts.slice(0, 10).map((merchant) => (
                  <div key={merchant.id} className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xl font-bold text-gray-900">{merchant.businessName}</p>
                        <p className="text-lg text-gray-600">{merchant.merchantNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {merchant.cnpsDaysLeft !== null && merchant.cnpsDaysLeft <= 30 && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-red-600">
                            CNPS : {merchant.cnpsDaysLeft} jours restants
                          </span>
                        </div>
                      )}
                      {merchant.cmuDaysLeft !== null && merchant.cmuDaysLeft <= 30 && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-red-600">
                            CMU : {merchant.cmuDaysLeft} jours restants
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {merchantsWithAlerts.length > 10 && (
                  <p className="text-center text-xl text-gray-600 py-4">
                    + {merchantsWithAlerts.length - 10} autres alertes
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Marchands inactifs */}
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-orange-100 p-4 rounded-full">
                <UserX className="w-12 h-12 text-orange-600" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Marchands Inactifs</h2>
                <p className="text-xl text-gray-600">&gt; 30 jours sans vente</p>
              </div>
            </div>

            {inactiveMerchants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl text-gray-500">✅ Tous les marchands sont actifs</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {inactiveMerchants.slice(0, 10).map((merchant) => (
                  <div key={merchant.id} className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xl font-bold text-gray-900">{merchant.businessName}</p>
                        <p className="text-lg text-gray-600">{merchant.merchantNumber}</p>
                        <p className="text-lg text-orange-600 font-semibold mt-2">
                          {merchant.daysSinceLastSale} jours d'inactivité
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {inactiveMerchants.length > 10 && (
                  <p className="text-center text-xl text-gray-600 py-4">
                    + {inactiveMerchants.length - 10} autres inactifs
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RÉPARTITION GÉOGRAPHIQUE */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Répartition Géographique</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketDistribution.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <p className="text-2xl font-bold text-gray-900 mb-2">{item.market || 'Non spécifié'}</p>
                <p className="text-4xl font-bold text-blue-600">{item.count} marchands</p>
              </div>
            ))}
          </div>
        </div>

        {/* Message d'encouragement */}
        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-green-400 to-green-500 rounded-2xl p-8 shadow-xl">
            <p className="text-4xl font-bold text-green-900">
              🎯 Objectif 2025 : 10 000 marchands enrôlés
            </p>
            <p className="text-2xl text-green-800 mt-2">
              Progression : {stats?.totalMerchants || 0} / 10 000 ({((stats?.totalMerchants || 0) / 10000 * 100).toFixed(1)}%)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
