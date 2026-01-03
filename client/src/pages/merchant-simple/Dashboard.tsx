import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ShoppingCart, Package, History, Home, User, Eye, EyeOff, TrendingUp, AlertCircle, Sun, Cloud, CloudRain } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { AfricanPattern } from '@/components/ui/african-pattern';
import { trpc } from '@/lib/trpc';

export default function MerchantDashboard() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Récupération des données en temps réel
  const { data: salesData } = trpc.sales.getTodayStats.useQuery();
  const { data: stockData } = trpc.products.getAll.useQuery();
  const { data: weather } = trpc.weather.getCurrentWeather.useQuery();

  // Mise à jour de la date toutes les minutes
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Formatage de la date intelligente
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    return currentDate.toLocaleDateString('fr-FR', options);
  };

  // Calcul du total en caisse aujourd'hui
  const totalCaisse = salesData?.totalRevenue || 0;

  // Détection des stocks faibles (< 20%)
  const lowStockItems = stockData?.filter(item => {
    const stockPercentage = (item.quantity / (item.quantity + 50)) * 100; // Approximation
    return stockPercentage < 20;
  }) || [];

  // Calcul de l'objectif (exemple: 50,000 FCFA par jour)
  const dailyGoal = 50000;
  const progressPercentage = Math.min((totalCaisse / dailyGoal) * 100, 100);

  // Icône météo
  const getWeatherIcon = () => {
    if (!weather) return <Sun className="w-8 h-8 text-yellow-400" />;
    const condition = weather.condition?.toLowerCase() || '';
    if (condition.includes('rain')) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (condition.includes('cloud')) return <Cloud className="w-8 h-8 text-gray-400" />;
    return <Sun className="w-8 h-8 text-yellow-400" />;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Background marché vibrant */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/marche-ivoirien.jpg)',
          filter: 'brightness(0.85) saturate(1.3) contrast(1.05)',
        }}
      />

      {/* Overlay dégradé terre */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D35400]/35 via-[#E67E22]/25 to-[#27AE60]/30" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <InstitutionalHeader />

        <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
          {/* 1. EN-TÊTE CONTEXTUEL - Date + Météo */}
          <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-2 border-white/30 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 text-[#C25E00] opacity-[0.03] pointer-events-none">
              <AfricanPattern variant="geometric" opacity={0.3} />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-[#C25E00] to-[#E67E22] rounded-2xl shadow-lg">
                  {getWeatherIcon()}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 capitalize">
                    {formatDate()}
                  </h2>
                  <p className="text-sm text-gray-600 font-semibold">
                    {weather?.temperature ? `${Math.round(weather.temperature)}°C` : 'Chargement...'}
                  </p>
                </div>
              </div>

              {/* Tantie Sagesse (Desktop) */}
              <div className="hidden sm:block relative">
                <div className="absolute inset-0 bg-[#C25E00]/20 rounded-2xl blur-xl" />
                <img
                  src="/tantie-sagesse.png"
                  alt="Tantie Sagesse"
                  className="relative w-28 h-28 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Salutation avec Tantie Sagesse */}
          <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-2 border-white/30 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 text-[#C25E00] opacity-[0.03] pointer-events-none">
              <AfricanPattern variant="wax" opacity={0.3} />
            </div>

            <div className="relative z-10 flex items-center gap-4">
              {/* Tantie Sagesse (Mobile) */}
              <div className="sm:hidden relative flex-shrink-0">
                <div className="absolute inset-0 bg-[#C25E00]/20 rounded-2xl blur-lg" />
                <img
                  src="/tantie-sagesse.png"
                  alt="Tantie Sagesse"
                  className="relative w-20 h-20 object-contain drop-shadow-2xl"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Bonjour Patrick ! 👋
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  Prêt pour les affaires ?
                </p>
              </div>
            </div>
          </div>

          {/* 2. LE COFFRE-FORT - Total en Caisse */}
          <div className="backdrop-blur-2xl bg-gradient-to-br from-[#2E7D32]/95 via-[#27AE60]/95 to-[#4CAF50]/95 text-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-2 border-white/20 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
              <AfricanPattern variant="wax" opacity={0.5} />
            </div>

            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white/90">
                  💰 TOTAL EN CAISSE
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="backdrop-blur-xl bg-white/20 hover:bg-white/30 p-3 rounded-full border-2 border-white/30 transition-all transform hover:scale-110"
                  title={showBalance ? "Masquer" : "Afficher"}
                >
                  {showBalance ? (
                    <EyeOff className="w-6 h-6 text-white" />
                  ) : (
                    <Eye className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>

              <div className="text-center py-4">
                {showBalance ? (
                  <div className="text-6xl font-black drop-shadow-2xl">
                    {formatAmount(totalCaisse)} <span className="text-4xl">FCFA</span>
                  </div>
                ) : (
                  <div className="text-6xl font-black drop-shadow-2xl tracking-wider">
                    ★★★★★
                  </div>
                )}
                <p className="text-white/80 text-sm mt-2 font-medium">
                  Aujourd'hui • {salesData?.salesCount || 0} ventes
                </p>
              </div>
            </div>
          </div>

          {/* 3. TUILES INTUITIVES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Tuile Alerte Stock */}
            {lowStockItems.length > 0 ? (
              <div className="backdrop-blur-xl bg-red-500/95 text-white rounded-3xl p-6 shadow-[0_8px_32px_rgba(220,38,38,0.4)] border-2 border-white/20 relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
                  <AfricanPattern variant="geometric" opacity={0.5} />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-10 h-10" />
                    <h3 className="text-2xl font-black">ALERTE STOCK</h3>
                  </div>
                  <p className="text-lg font-semibold mb-2">
                    {lowStockItems.length} produit{lowStockItems.length > 1 ? 's' : ''} en rupture
                  </p>
                  <button
                    onClick={() => setLocation('/merchant/stock')}
                    className="backdrop-blur-xl bg-white/20 hover:bg-white/30 px-6 py-3 rounded-full font-bold text-sm border-2 border-white/30 transition-all"
                  >
                    Voir le stock →
                  </button>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-2 border-white/30 relative overflow-hidden">
                <div className="absolute inset-0 text-[#2E7D32] opacity-[0.03] pointer-events-none">
                  <AfricanPattern variant="wax" opacity={0.3} />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#2E7D32] rounded-xl">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Stock OK</h3>
                  </div>
                  <p className="text-gray-600 font-medium">
                    Tous les produits sont disponibles
                  </p>
                </div>
              </div>
            )}

            {/* Tuile Objectif du Jour */}
            <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-2 border-white/30 relative overflow-hidden">
              <div className="absolute inset-0 text-[#C25E00] opacity-[0.03] pointer-events-none">
                <AfricanPattern variant="kente" opacity={0.3} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-[#C25E00] to-[#E67E22] rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Objectif du Jour</h3>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-black text-gray-900">
                      {Math.round(progressPercentage)}%
                    </span>
                    <span className="text-sm text-gray-600 font-medium">
                      {formatAmount(dailyGoal)} FCFA
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {progressPercentage >= 100 && (
                  <p className="text-[#2E7D32] font-bold text-sm">
                    🎉 Objectif atteint !
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Aide rapide */}
          <div className="backdrop-blur-xl bg-[#F39C12]/95 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-2 border-white/20 text-center relative overflow-hidden">
            <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
              <AfricanPattern variant="geometric" opacity={0.5} />
            </div>

            <div className="relative z-10">
              <p className="text-2xl font-black text-white drop-shadow-lg">
                ❓ Besoin d'aide ?
              </p>
              <p className="text-lg text-white/90 font-semibold mt-1">
                Appelle ton agent terrain
              </p>
            </div>
          </div>
        </main>

        {/* 4. NAVIGATION BOTTOM BAR FIXE */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/95 border-t-2 border-white/30 shadow-[0_-8px_32px_rgba(0,0,0,0.2)]">
          <div className="relative">
            {/* Bouton Central VENDRE (Floating) */}
            <button
              onClick={() => setLocation('/merchant/cash-register')}
              className="absolute left-1/2 -translate-x-1/2 -top-10 backdrop-blur-2xl bg-gradient-to-br from-[#C25E00] via-[#D35400] to-[#E67E22] hover:from-[#A04000] hover:via-[#C25E00] hover:to-[#D35400] w-20 h-20 rounded-full shadow-[0_8px_32px_rgba(194,94,0,0.5)] flex items-center justify-center border-4 border-white transform hover:scale-110 active:scale-95 transition-all group"
            >
              <ShoppingCart className="w-10 h-10 text-white" strokeWidth={3} />
            </button>

            {/* Barre de navigation */}
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-around py-3">
                {/* Accueil */}
                <button
                  onClick={() => setLocation('/merchant/dashboard')}
                  className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#C25E00] transition-colors group"
                >
                  <Home className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Accueil</span>
                </button>

                {/* Stock */}
                <button
                  onClick={() => setLocation('/merchant/stock')}
                  className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#2E7D32] transition-colors group"
                >
                  <Package className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Stock</span>
                </button>

                {/* Espace pour le bouton central */}
                <div className="w-16" />

                {/* Historique */}
                <button
                  onClick={() => setLocation('/merchant/history')}
                  className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#D35400] transition-colors group"
                >
                  <History className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Historique</span>
                </button>

                {/* Profil */}
                <button
                  onClick={() => setLocation('/merchant/profile')}
                  className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#F39C12] transition-colors group"
                >
                  <User className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Profil</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
