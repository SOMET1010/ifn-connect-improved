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
import { Tooltip } from '@/components/Tooltip';
import { DailyReportModal } from '@/components/DailyReportModal';
import { MicroGoalsWidget } from '@/components/MicroGoalsWidget';
import { SalesChart } from '@/components/SalesChart';
import { GroupedOrderOpportunityCard } from '@/components/GroupedOrderOpportunityCard';

/**
 * Widget d'opportunités de commandes groupées
 * TODO: Activer après rechargement des types tRPC
 */
/*
function GroupedOrderOpportunities({ merchantId }: { merchantId: number }) {
  const { data: opportunities = [], isLoading } = trpc.groupedOrders.getOpportunities.useQuery({ merchantId });

  if (isLoading || opportunities.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">📢 Opportunités du jour</h2>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          {opportunities.length}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {opportunities.map((opp: any) => (
          <GroupedOrderOpportunityCard
            key={opp.id}
            orderId={opp.id}
            productName={opp.productName}
            participantsCount={opp.participantsCount}
            totalQuantity={opp.totalQuantity}
            estimatedSavings={opp.estimatedSavings}
          />
        ))}
      </div>
    </div>
  );
}
*/

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
  const [showDailyReport, setShowDailyReport] = useState(false);
  
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

  // Déclenchement automatique du bilan de journée à 19h00
  useEffect(() => {
    const checkDailyReport = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Vérifier si déjà affiché aujourd'hui
      const lastShown = localStorage.getItem('lastDailyReport');
      const today = new Date().toDateString();
      
      if (lastShown !== today && hour >= 19) {
        // Afficher le modal après 2 secondes
        setTimeout(() => {
          setShowDailyReport(true);
          localStorage.setItem('lastDailyReport', today);
        }, 2000);
      }
    };
    
    // Vérifier toutes les minutes
    const interval = setInterval(checkDailyReport, 60000);
    checkDailyReport(); // Vérifier immédiatement
    
    return () => clearInterval(interval);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header institutionnel */}
      <InstitutionalHeader />
      
      {/* Badge d'alertes de stock */}
      <StockAlertsBadge merchantId={merchantId} />

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8">
        
        {/* Message de bienvenue PRO */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            Bonjour {businessName || 'Marchand'} ! <span className="text-3xl">👋</span>
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Badge code copiable */}
            <button
              onClick={(e) => {
                // Animation au clic
                const btn = e.currentTarget;
                btn.classList.add('animate-[wiggle_0.5s_ease-in-out]');
                setTimeout(() => btn.classList.remove('animate-[wiggle_0.5s_ease-in-out]'), 500);
                
                navigator.clipboard.writeText(merchantNumber);
                // Toast notification
                const toast = document.createElement('div');
                toast.textContent = '✅ Code copié !';
                toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-300';
                document.body.appendChild(toast);
                setTimeout(() => {
                  toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
                  setTimeout(() => toast.remove(), 300);
                }, 2000);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <span className="text-sm font-medium text-gray-600">Code :</span>
              <span className="font-bold text-orange-600">{merchantNumber}</span>
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {/* Statut synchro */}
            <div className="text-sm text-gray-500">
              Dernière synchro : {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* 3 KPIs ESSENTIELS - Cartes PRO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Ventes du jour */}
          <Tooltip content="Total des ventes enregistrées aujourd'hui" position="top">
            <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-neutral-600">Aujourd'hui</p>
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <p className="text-4xl font-semibold leading-none text-gray-900">{todayAmount.toLocaleString()}</p>
              <p className="mt-1 text-sm text-neutral-500">FCFA</p>
            </div>
            </div>
          </Tooltip>

          {/* Solde total */}
          <Tooltip content="Solde total de toutes vos ventes cumulées" position="top">
            <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-neutral-600">Mon Bédou</p>
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <p className="text-4xl font-semibold leading-none text-gray-900">{balance.toLocaleString()}</p>
              <p className="mt-1 text-sm text-neutral-500">FCFA</p>
            </div>
            </div>
          </Tooltip>

          {/* Alertes stock */}
          <Tooltip content="Nombre de produits avec stock inférieur au seuil d'alerte" position="top">
            <div className={`rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow ${
            lowStock > 0 
              ? 'border-orange-200 bg-orange-50' 
              : 'border-black/5 bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-neutral-600">Alertes</p>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                lowStock > 0 ? 'bg-orange-100' : 'bg-gray-50'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  lowStock > 0 ? 'text-orange-600' : 'text-gray-400'
                }`} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <p className={`text-4xl font-semibold leading-none ${
                lowStock > 0 ? 'text-orange-600' : 'text-gray-900'
              }`}>{lowStock}</p>
              <p className="mt-1 text-sm text-neutral-500">Produits bas</p>
            </div>
            </div>
          </Tooltip>
        </div>

        {/* GRAPHIQUE VENTES 7 JOURS */}
        <div className="mb-8">
          <SalesChart merchantId={merchantId} />
        </div>

        {/* MICRO-OBJECTIFS DYNAMIQUES */}
        <MicroGoalsWidget merchantId={merchantId} />

        {/* OPPORTUNITÉS DE COMMANDES GROUPÉES */}
        {/* <GroupedOrderOpportunities merchantId={merchantId} /> */}

        {/* WIDGET SCORE SUTA - Carte Action */}
        <div className="mb-8">
          <ScoreCard merchantId={merchantId} />
        </div>

        {/* 6 BOUTONS D'ACTION ÉPURÉS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-7xl mx-auto">
          {/* VENDRE - Action principale */}
          <button
            id="btn-cash-register"
            onClick={() => setLocation('/merchant/cash-register-simple')}
            className="bg-white border-2 border-orange-200 rounded-2xl shadow-sm hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 p-4 md:p-8 group relative"
          >
            {/* Badge "Action principale" */}
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
              ⭐ Principal
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="bg-orange-50 p-4 md:p-6 rounded-full group-hover:bg-orange-100 transition-colors">
                <ShoppingCart className="w-16 md:w-24 h-16 md:h-24 text-orange-600" strokeWidth={2} />
              </div>
              <div className="text-center">
                <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-gray-900">VENDRE</h2>
                <p className="text-sm md:text-lg text-gray-600">Faire mon Djossi</p>
              </div>
            </div>
          </button>

          {/* COMMANDER */}
          <button
            onClick={() => setLocation('/merchant/market')}
            className="bg-white border-2 border-green-200 rounded-2xl shadow-sm hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 p-4 md:p-8 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-green-50 p-4 md:p-6 rounded-full group-hover:bg-green-100 transition-colors">
                <Package className="w-16 md:w-24 h-16 md:h-24 text-green-600" strokeWidth={2} />
              </div>
              <div className="text-center">
                <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-gray-900">COMMANDER</h2>
                <p className="text-sm md:text-lg text-gray-600">Acheter des produits</p>
              </div>
            </div>
          </button>

          {/* MON ARGENT */}
          <button
            onClick={() => setLocation('/merchant/orders')}
            className="bg-white border-2 border-blue-200 rounded-2xl shadow-sm hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 p-4 md:p-8 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-blue-50 p-4 md:p-6 rounded-full group-hover:bg-blue-100 transition-colors">
                <Wallet className="w-16 md:w-24 h-16 md:h-24 text-blue-600" strokeWidth={2} />
              </div>
              <div className="text-center">
                <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-gray-900">MON ARGENT</h2>
                <p className="text-sm md:text-lg text-gray-600">Voir mon Bédou</p>
              </div>
            </div>
          </button>

          {/* MON ÉPARGNE */}
          <button
            onClick={() => setLocation('/merchant/savings')}
            className="bg-white border-2 border-pink-200 rounded-2xl shadow-sm hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 p-4 md:p-8 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-pink-50 p-4 md:p-6 rounded-full group-hover:bg-pink-100 transition-colors">
                <PiggyBank className="w-16 md:w-24 h-16 md:h-24 text-pink-600" strokeWidth={2} />
              </div>
              <div className="text-center">
                <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-gray-900">ÉPARGNER</h2>
                <p className="text-sm md:text-lg text-gray-600">Mes Cagnottes</p>
              </div>
            </div>
          </button>

          {/* ÉVÉNEMENTS */}
          <button
            onClick={() => setLocation('/merchant/events')}
            className="bg-white border-2 border-indigo-200 rounded-2xl shadow-sm hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 p-4 md:p-8 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-indigo-50 p-4 md:p-6 rounded-full group-hover:bg-indigo-100 transition-colors">
                <svg className="w-16 md:w-24 h-16 md:h-24 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-gray-900">ÉVÉNEMENTS</h2>
                <p className="text-sm md:text-lg text-gray-600">Ramadan, Tabaski...</p>
              </div>
            </div>
          </button>

          {/* MON PROFIL */}
          <button
            id="btn-profile"
            onClick={() => setLocation('/merchant/profile')}
            className="bg-white border-2 border-purple-200 rounded-2xl shadow-sm hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 p-4 md:p-8 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-purple-50 p-4 md:p-6 rounded-full group-hover:bg-purple-100 transition-colors">
                <User className="w-16 md:w-24 h-16 md:h-24 text-purple-600" strokeWidth={2} />
              </div>
              <div className="text-center">
                <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-gray-900">MON PROFIL</h2>
                <p className="text-sm md:text-lg text-gray-600">Mon identité</p>
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
      
      {/* Bilan de journée automatique */}
      <DailyReportModal
        open={showDailyReport}
        onClose={() => setShowDailyReport(false)}
      />
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
