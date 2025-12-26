import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Onboarding } from '@/components/Onboarding';
import { 
  ShoppingCart, 
  Package, 
  Wallet,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  User,
  PiggyBank
} from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { StockAlertsBadge } from '@/components/StockAlertsBadge';
import { ScoreCard } from '@/components/ScoreCard';
import { CopilotAssistant } from '@/components/CopilotAssistant';

/**
 * Composant interne qui contient toute la logique du dashboard
 * Ne rend que si merchant existe
 */
function DashboardContent({ merchantId, businessName, merchantNumber }: { 
  merchantId: number; 
  businessName: string | null; 
  merchantNumber: string; 
}) {
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Tous les hooks sont maintenant appelés inconditionnellement
  const { data: todayStats } = trpc.sales.todayStats.useQuery({ merchantId });
  const { data: totalBalance } = trpc.sales.totalBalance.useQuery({ merchantId });
  const { data: lowStockCount } = trpc.sales.lowStockCount.useQuery({ merchantId });

  const todayAmount = todayStats?.totalAmount || 0;
  const balance = totalBalance || 0;
  const lowStock = lowStockCount || 0;
  
  // Vérifier si c'est le premier lancement
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('ifn-onboarding-completed');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);
  
  const handleOnboardingComplete = () => {
    localStorage.setItem('ifn-onboarding-completed', 'true');
    setShowOnboarding(false);
  };
  
  const handleOnboardingSkip = () => {
    localStorage.setItem('ifn-onboarding-completed', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header institutionnel */}
      <InstitutionalHeader />
      
      {/* Badge d'alertes de stock */}
      <StockAlertsBadge merchantId={merchantId} />

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-12">
        
        {/* Message de bienvenue GÉANT */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Bonjour {businessName || 'Marchand'} ! 👋
          </h1>
          <p className="text-3xl text-gray-700">
            Code : <span className="font-bold text-orange-600">{merchantNumber}</span>
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

        {/* WIDGET SCORE SUTA */}
        <div className="mb-16 max-w-2xl mx-auto">
          <ScoreCard merchantId={merchantId} />
        </div>

        {/* 5 GROS BOUTONS D'ACTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* VENDRE - Action principale */}
          <button
            id="btn-cash-register"
            onClick={() => setLocation('/merchant/cash-register-simple')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-16 group relative"
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

          {/* MON ÉPARGNE */}
          <button
            onClick={() => setLocation('/merchant/savings')}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-16 group"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                <PiggyBank className="w-32 h-32 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-6xl font-bold mb-3">ÉPARGNER</h2>
                <p className="text-3xl text-white/90">Mes Cagnottes</p>
              </div>
            </div>
          </button>

          {/* ÉVÉNEMENTS */}
          <button
            onClick={() => setLocation('/merchant/events')}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-16 group"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h2 className="text-6xl font-bold mb-3">ÉVÉNEMENTS</h2>
                <p className="text-3xl text-white/90">Ramadan, Tabaski...</p>
              </div>
            </div>
          </button>

          {/* MON PROFIL */}
          <button
            id="btn-profile"
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
      
      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      
      {/* Copilote SUTA */}
      <CopilotAssistant />
    </div>
  );
}

/**
 * Composant wrapper qui gère l'authentification
 * Ne rend DashboardContent que si les conditions sont remplies
 */
export default function MerchantDashboardSimple() {
  const { merchant, isLoading: authLoading } = useAuth();
  
  // Vérification AVANT d'appeler les hooks du composant interne
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

  return (
    <DashboardContent 
      merchantId={merchant.id}
      businessName={merchant.businessName}
      merchantNumber={merchant.merchantNumber}
    />
  );
}
