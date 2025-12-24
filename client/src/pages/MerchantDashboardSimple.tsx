import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { 
  ShoppingCart, 
  Package, 
  Wallet,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  User
} from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';

/**
 * Dashboard Marchand - VERSION ULTRA-SIMPLIFIÉE
 * 4 gros boutons d'action + 3 KPIs essentiels
 */
export default function MerchantDashboardSimple() {
  const [, setLocation] = useLocation();
  const { merchant, isLoading: authLoading } = useAuth();
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <div className="text-4xl font-bold text-gray-700">Chargement...</div>
      </div>
    );
  }
  
  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <div className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-2xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">⚠️ Accès Refusé</h1>
          <p className="text-3xl text-gray-700">Vous devez être enregistré comme marchand.</p>
        </div>
      </div>
    );
  }
  
  const merchantId = merchant.id;
  
  // Récupérer les 3 KPIs essentiels
  const { data: todayStats } = trpc.sales.todayStats.useQuery({ merchantId });
  const { data: totalBalance } = trpc.sales.totalBalance.useQuery({ merchantId });
  const { data: lowStockCount } = trpc.sales.lowStockCount.useQuery({ merchantId });

  const todayAmount = todayStats?.totalAmount || 0;
  const balance = totalBalance || 0;
  const lowStock = lowStockCount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header institutionnel */}
      <InstitutionalHeader />

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-12">
        
        {/* Message de bienvenue GÉANT */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Bonjour {merchant.businessName || 'Marchand'} ! 👋
          </h1>
          <p className="text-3xl text-gray-700">
            Code : <span className="font-bold text-orange-600">{merchant.merchantNumber}</span>
          </p>
        </div>

        {/* 3 KPIs ESSENTIELS - Cartes GÉANTES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Ventes du jour */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-10 shadow-2xl text-white">
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp className="w-16 h-16" strokeWidth={2.5} />
              <h2 className="text-3xl font-bold">Aujourd'hui</h2>
            </div>
            <p className="text-6xl font-bold mb-2">{todayAmount.toLocaleString()}</p>
            <p className="text-2xl text-blue-100">FCFA</p>
          </div>

          {/* Solde total */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-10 shadow-2xl text-white">
            <div className="flex items-center gap-4 mb-4">
              <Wallet className="w-16 h-16" strokeWidth={2.5} />
              <h2 className="text-3xl font-bold">Mon Bédou</h2>
            </div>
            <p className="text-6xl font-bold mb-2">{balance.toLocaleString()}</p>
            <p className="text-2xl text-green-100">FCFA</p>
          </div>

          {/* Alertes stock */}
          <div className={`bg-gradient-to-br ${lowStock > 0 ? 'from-red-500 to-red-600' : 'from-gray-400 to-gray-500'} rounded-3xl p-10 shadow-2xl text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="w-16 h-16" strokeWidth={2.5} />
              <h2 className="text-3xl font-bold">Alertes</h2>
            </div>
            <p className="text-6xl font-bold mb-2">{lowStock}</p>
            <p className="text-2xl text-white/90">Produits bas</p>
          </div>
        </div>

        {/* 4 GROS BOUTONS D'ACTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* VENDRE - Action principale */}
          <button
            onClick={() => setLocation('/merchant/cash-register')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-16 group relative"
          >
            {/* Badge "Action principale" */}
            <div className="absolute top-6 right-6 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-lg font-bold">
              ⭐ Principal
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                <ShoppingCart className="w-32 h-32 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-6xl font-bold mb-3">VENDRE</h2>
                <p className="text-3xl text-white/90">Faire mon Djossi</p>
              </div>
            </div>
          </button>

          {/* COMMANDER */}
          <button
            onClick={() => setLocation('/merchant/market')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-16 group"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                <Package className="w-32 h-32 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-6xl font-bold mb-3">COMMANDER</h2>
                <p className="text-3xl text-white/90">Acheter des produits</p>
              </div>
            </div>
          </button>

          {/* MON ARGENT */}
          <button
            onClick={() => setLocation('/merchant/orders')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-16 group"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                <Wallet className="w-32 h-32 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-6xl font-bold mb-3">MON ARGENT</h2>
                <p className="text-3xl text-white/90">Voir mon Bédou</p>
              </div>
            </div>
          </button>

          {/* MON PROFIL */}
          <button
            onClick={() => setLocation('/merchant/profile')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-16 group"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                <User className="w-32 h-32 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-6xl font-bold mb-3">MON PROFIL</h2>
                <p className="text-3xl text-white/90">Mon identité</p>
              </div>
            </div>
          </button>
        </div>

        {/* Message d'encouragement */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-8 shadow-xl">
            <p className="text-4xl font-bold text-yellow-900">
              💪 Bon travail aujourd'hui !
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
