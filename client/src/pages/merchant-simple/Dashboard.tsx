import { useLocation } from 'wouter';
import { ShoppingCart, Package, Wallet, History, ArrowLeft, Send } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { AfricanPattern } from '@/components/ui/african-pattern';

export default function MerchantDashboard() {
  const [, setLocation] = useLocation();

  const buttons = [
    {
      id: 'vendre',
      title: 'VENDRE',
      subtitle: 'Encaisser vente',
      icon: ShoppingCart,
      route: '/merchant/cash-register',
      gradient: 'from-[#C25E00]/90 via-[#D35400]/90 to-[#E67E22]/90',
      hoverGradient: 'hover:from-[#A04000]/95 hover:via-[#C25E00]/95 hover:to-[#D35400]/95',
      pattern: 'wax' as const,
    },
    {
      id: 'historique',
      title: 'HISTORIQUE',
      subtitle: 'Voir mes ventes',
      icon: History,
      route: '/merchant/history',
      gradient: 'from-[#D35400]/85 via-[#C25E00]/85 to-[#A04000]/85',
      hoverGradient: 'hover:from-[#C25E00]/95 hover:via-[#A04000]/95 hover:to-[#8B3000]/95',
      pattern: 'geometric' as const,
    },
    {
      id: 'stock',
      title: 'STOCK',
      subtitle: 'Gérer produits',
      icon: Package,
      route: '/merchant/stock',
      gradient: 'from-[#2E7D32]/90 via-[#27AE60]/90 to-[#4CAF50]/90',
      hoverGradient: 'hover:from-[#1B5E20]/95 hover:via-[#2E7D32]/95 hover:to-[#27AE60]/95',
      pattern: 'wax' as const,
    },
    {
      id: 'wallet',
      title: 'WALLET',
      subtitle: 'Envoyer argent',
      icon: Send,
      route: '/merchant/wallet',
      gradient: 'from-[#E67E22]/85 via-[#F39C12]/85 to-[#F1C40F]/85',
      hoverGradient: 'hover:from-[#D35400]/95 hover:via-[#E67E22]/95 hover:to-[#F39C12]/95',
      pattern: 'geometric' as const,
    },
    {
      id: 'argent',
      title: 'ÉPARGNE',
      subtitle: 'Économiser',
      icon: Wallet,
      route: '/merchant/savings',
      gradient: 'from-[#F1C40F]/90 via-[#F39C12]/90 to-[#E67E22]/90',
      hoverGradient: 'hover:from-[#F39C12]/95 hover:via-[#E67E22]/95 hover:to-[#D35400]/95',
      pattern: 'kente' as const,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
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

        {/* Bouton retour Glassmorphism */}
        <button
          onClick={() => setLocation('/')}
          className="fixed top-24 left-4 z-50 backdrop-blur-xl bg-white/90 hover:bg-white text-[#C25E00] p-4 rounded-full shadow-xl hover:shadow-2xl border-2 border-white/30 transition-all transform hover:scale-105"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <main className="flex-1 container mx-auto px-4 py-12">
          {/* Header avec Tantie Sagesse */}
          <div className="text-center mb-12 space-y-6">
            {/* Avatar Tantie */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-2xl scale-110" />
                <img
                  src="/suta-avatar-3d.png"
                  alt="Tantie Sagesse"
                  className="relative w-32 h-32 object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Message de bienvenue */}
            <div className="backdrop-blur-2xl bg-white/90 rounded-3xl px-8 py-6 inline-block shadow-2xl border-2 border-white/30 relative overflow-hidden">
              {/* Motif Wax */}
              <div className="absolute inset-0 text-[#C25E00] opacity-[0.05] pointer-events-none">
                <AfricanPattern variant="wax" opacity={0.3} />
              </div>

              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-[#2D3436] mb-2">
                  Bonjour Patrick ! 👋
                </h1>
                <p className="text-2xl md:text-3xl text-[#636E72]">
                  Que veux-tu faire aujourd'hui ?
                </p>
              </div>
            </div>
          </div>

          {/* Grid de boutons d'action Glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {buttons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  onClick={() => setLocation(btn.route)}
                  className={`
                    backdrop-blur-2xl bg-gradient-to-br ${btn.gradient} ${btn.hoverGradient}
                    text-white rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                    hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]
                    transform hover:scale-105 active:scale-95
                    transition-all duration-300
                    p-12 md:p-16
                    group relative overflow-hidden
                    min-h-[300px] md:min-h-[350px]
                    flex flex-col items-center justify-center gap-6
                    border-2 border-white/20
                  `}
                >
                  {/* Motif africain en arrière-plan */}
                  <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
                    <AfricanPattern variant={btn.pattern} opacity={0.5} />
                  </div>

                  {/* Icône avec glow */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors border-4 border-white/30">
                      <Icon className="w-24 h-24 md:w-32 md:h-32 text-white" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Texte */}
                  <div className="space-y-2 relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black drop-shadow-2xl">
                      {btn.title}
                    </h2>
                    <p className="text-xl md:text-2xl text-white/90 font-semibold">
                      {btn.subtitle}
                    </p>
                  </div>

                  {/* Flèche */}
                  <div className="absolute bottom-6 right-6 opacity-70 group-hover:opacity-100 transition-opacity">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Message d'aide Glassmorphism */}
          <div className="mt-16 text-center">
            <div className="inline-block backdrop-blur-2xl bg-[#2E7D32]/90 border-4 border-[#4CAF50]/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              {/* Motif */}
              <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
                <AfricanPattern variant="kente" opacity={0.5} />
              </div>

              <div className="relative z-10">
                <p className="text-3xl text-white font-bold drop-shadow-lg">
                  ❓ Besoin d'aide ?
                </p>
                <p className="text-2xl text-white/90 mt-2 font-semibold">
                  Appelle ton agent terrain
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
