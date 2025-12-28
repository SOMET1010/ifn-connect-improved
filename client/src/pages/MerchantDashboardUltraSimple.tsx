import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceMessage } from '@/hooks/useVoice';
import { trpc } from '@/lib/trpc';
import { 
  ShoppingCart, 
  Package, 
  Wallet,
  HelpCircle,
  History
} from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';

/**
 * Dashboard Marchand Ultra-Simplifié
 * 
 * Interface 100% accessible pour marchands peu alphabétisés :
 * - 4 GROS boutons uniquement
 * - Pictogrammes géants (200px)
 * - Aucun texte superflu
 * - Guidage vocal automatique
 */

function DashboardContent({ merchantId }: { merchantId: number }) {
  const [, setLocation] = useLocation();
  const { speakMessage, isEnabled, toggle } = useVoiceMessage();

  // Jouer le message de bienvenue au chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      speakMessage('welcome');
    }, 1000);
    return () => clearTimeout(timer);
  }, [speakMessage]);

  const buttons = [
    {
      id: 'vendre',
      title: 'VENDRE',
      icon: ShoppingCart,
      color: 'orange',
      route: '/merchant/cash-register',
      messageId: 'sell',
      bgColor: 'bg-orange-50',
      hoverBgColor: 'hover:bg-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-300'
    },
    {
      id: 'historique',
      title: 'HISTORIQUE',
      icon: History,
      color: 'purple',
      route: '/merchant/sales-history',
      messageId: 'history',
      bgColor: 'bg-purple-50',
      hoverBgColor: 'hover:bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-300'
    },
    {
      id: 'stock',
      title: 'STOCK',
      icon: Package,
      color: 'blue',
      route: '/merchant/stock',
      messageId: 'stock',
      bgColor: 'bg-blue-50',
      hoverBgColor: 'hover:bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-300'
    },
    {
      id: 'argent',
      title: 'ARGENT',
      icon: Wallet,
      color: 'green',
      route: '/merchant/savings',
      messageId: 'money',
      bgColor: 'bg-green-50',
      hoverBgColor: 'hover:bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-300'
    },
    {
      id: 'aide',
      title: 'AIDE',
      icon: HelpCircle,
      color: 'purple',
      route: '/merchant/journey',
      messageId: 'help',
      bgColor: 'bg-purple-50',
      hoverBgColor: 'hover:bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-300'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header institutionnel */}
      <InstitutionalHeader />
      
      {/* Contenu principal - 4 GROS BOUTONS */}
      <main className="container mx-auto px-4 py-12">
        
        {/* Grille 2x2 pour les 4 boutons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {buttons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={() => {
                  speakMessage(btn.messageId as any);
                  setTimeout(() => setLocation(btn.route), 500);
                }}
                onMouseEnter={() => speakMessage(btn.messageId as any)}
                className={`
                  ${btn.bgColor} ${btn.hoverBgColor} ${btn.borderColor}
                  border-4 rounded-3xl shadow-2xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-300
                  p-12 md:p-16
                  group relative
                  min-h-[300px] md:min-h-[400px]
                  flex flex-col items-center justify-center gap-8
                `}
              >
                {/* Pictogramme GÉANT */}
                <div className={`
                  ${btn.bgColor}
                  p-8 rounded-full 
                  group-hover:animate-pulse
                  shadow-lg
                `}>
                  <Icon 
                    className={`${btn.iconColor} w-32 h-32 md:w-48 md:h-48`} 
                    strokeWidth={2.5} 
                  />
                </div>
                
                {/* Titre ÉNORME */}
                <h2 className={`
                  ${btn.iconColor}
                  text-5xl md:text-7xl font-black
                  tracking-wide
                `}>
                  {btn.title}
                </h2>

                {/* Indicateur visuel d'interaction */}
                <div className="absolute bottom-6 right-6 opacity-50 group-hover:opacity-100 transition-opacity">
                  <svg className={`w-12 h-12 ${btn.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bouton de contrôle audio (discret en bas) */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={toggle}
            className={`
              ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}
              text-white p-4 rounded-full shadow-lg
              hover:scale-110 active:scale-95
              transition-all duration-200
            `}
            aria-label={isEnabled ? 'Désactiver le son' : 'Activer le son'}
          >
            {isEnabled ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

/**
 * Composant principal avec gestion de l'authentification
 */
export default function MerchantDashboardUltraSimple() {
  const { merchant, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-orange-600 mx-auto mb-8"></div>
          <p className="text-3xl font-bold text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  // Non connecté ou pas de profil marchand
  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingCart className="w-32 h-32 text-orange-600 mx-auto mb-8" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Connexion requise</h1>
          <p className="text-xl text-gray-600 mb-8">Vous devez vous connecter pour accéder à votre espace marchand</p>
          <button
            onClick={() => setLocation('/')}
            className="bg-orange-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-orange-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return <DashboardContent merchantId={merchant.id} />;
}
