import { useLocation } from 'wouter';
import { ShoppingCart, Package, Wallet, History, ArrowLeft } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';

export default function MerchantDashboard() {
  const [, setLocation] = useLocation();

  const buttons = [
    {
      id: 'vendre',
      title: 'VENDRE',
      subtitle: 'Encaisser vente',
      icon: ShoppingCart,
      route: '/merchant/cash-register',
      gradient: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    },
    {
      id: 'historique',
      title: 'HISTORIQUE',
      subtitle: 'Voir mes ventes',
      icon: History,
      route: '/merchant/history',
      gradient: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    },
    {
      id: 'stock',
      title: 'STOCK',
      subtitle: 'Gérer produits',
      icon: Package,
      route: '/merchant/stock',
      gradient: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    },
    {
      id: 'argent',
      title: 'ARGENT',
      subtitle: 'Épargne & gains',
      icon: Wallet,
      route: '/merchant/savings',
      gradient: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/')}
        className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-100 text-gray-700 p-4 rounded-full shadow-lg transition-all"
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Espace Marchand
          </h1>
          <p className="text-2xl md:text-3xl text-gray-600">
            Que veux-tu faire ?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {buttons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={() => setLocation(btn.route)}
                className={`
                  bg-gradient-to-r ${btn.gradient}
                  text-white rounded-3xl shadow-2xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-300
                  p-12 md:p-16
                  group relative
                  min-h-[300px] md:min-h-[350px]
                  flex flex-col items-center justify-center gap-6
                `}
              >
                <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                  <Icon className="w-24 h-24 md:w-32 md:h-32 text-white" strokeWidth={2.5} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-4xl md:text-5xl font-black">
                    {btn.title}
                  </h2>
                  <p className="text-xl md:text-2xl text-white/90">
                    {btn.subtitle}
                  </p>
                </div>

                <div className="absolute bottom-6 right-6 opacity-70 group-hover:opacity-100">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-blue-100 border-4 border-blue-300 rounded-2xl p-8">
            <p className="text-3xl text-blue-900 font-bold">
              ❓ Besoin d'aide ?
            </p>
            <p className="text-2xl text-blue-700 mt-2">
              Appelle ton agent terrain
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
