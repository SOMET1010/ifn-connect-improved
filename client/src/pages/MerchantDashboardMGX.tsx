import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceMessage } from '@/hooks/useVoice';
import { useNouchi } from '@/hooks/useNouchi';
import { useSensoryFeedback } from '@/lib/sensoryFeedback';
import { 
  ShoppingCart, 
  Package, 
  Wallet,
  HelpCircle
} from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';

/**
 * Dashboard Marchand MGX - Version Optimisée
 * 
 * Intègre toutes les meilleures pratiques MGX :
 * - Traductions Nouchi/Français
 * - Feedback sensoriel (vibrations + sons)
 * - Design KPATA (ombres colorées, rounded-3xl)
 * - Micro-interactions (hover:scale, active:scale)
 * - Pictogrammes géants avec icônes en arrière-plan
 */

function DashboardContent({ merchantId }: { merchantId: number }) {
  const [, setLocation] = useLocation();
  const { speakMessage, isEnabled, toggle } = useVoiceMessage();
  const { t, language, setLanguage } = useNouchi();
  const sensory = useSensoryFeedback();

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
      title: t.sell.toUpperCase(),
      icon: ShoppingCart,
      route: '/merchant/cash-register',
      messageId: 'sell',
      bgColor: 'bg-emerald-50',
      hoverBgColor: 'hover:bg-emerald-100',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-300',
      shadowColor: 'shadow-emerald-900/20'
    },
    {
      id: 'stock',
      title: t.stock.toUpperCase(),
      icon: Package,
      route: '/merchant/stock',
      messageId: 'stock',
      bgColor: 'bg-amber-50',
      hoverBgColor: 'hover:bg-amber-100',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-300',
      shadowColor: 'shadow-amber-900/20'
    },
    {
      id: 'argent',
      title: t.money.toUpperCase(),
      icon: Wallet,
      route: '/merchant/savings',
      messageId: 'money',
      bgColor: 'bg-green-50',
      hoverBgColor: 'hover:bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-300',
      shadowColor: 'shadow-green-900/20'
    },
    {
      id: 'aide',
      title: t.help.toUpperCase(),
      icon: HelpCircle,
      route: '/merchant/journey',
      messageId: 'help',
      bgColor: 'bg-indigo-50',
      hoverBgColor: 'hover:bg-indigo-100',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-300',
      shadowColor: 'shadow-indigo-900/20'
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
                  sensory.info(); // Vibration + son au clic
                  speakMessage(btn.messageId as any);
                  setTimeout(() => setLocation(btn.route), 500);
                }}
                onMouseEnter={() => speakMessage(btn.messageId as any)}
                className={`
                  ${btn.bgColor} ${btn.hoverBgColor} ${btn.borderColor} ${btn.shadowColor}
                  border-4 rounded-3xl shadow-2xl
                  hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-300
                  p-12 md:p-16
                  group relative overflow-hidden
                  min-h-[300px] md:min-h-[400px]
                  flex flex-col items-center justify-center gap-8
                `}
              >
                {/* Icône géante en arrière-plan (10% opacité) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <Icon className={`${btn.iconColor} w-96 h-96`} strokeWidth={1} />
                </div>

                {/* Pictogramme GÉANT */}
                <div className={`
                  ${btn.bgColor}
                  p-8 rounded-full 
                  group-hover:animate-pulse
                  shadow-lg
                  relative z-10
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
                  relative z-10
                `}>
                  {btn.title}
                </h2>

                {/* Flèche avec animation de translation */}
                <div className="absolute bottom-6 right-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <svg className={`w-12 h-12 ${btn.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Contrôles en bas : Langue + Audio */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4">
          {/* Bouton de langue FR/Nouchi */}
          <button
            onClick={() => {
              sensory.info();
              setLanguage(language === 'fr' ? 'nouchi' : 'fr');
            }}
            className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 font-bold text-lg"
            aria-label="Changer de langue"
          >
            {language === 'fr' ? '🇨🇮 Nouchi' : '🇫🇷 Français'}
          </button>
          
          {/* Bouton audio */}
          <button
            onClick={() => {
              sensory.info();
              toggle();
            }}
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
export default function MerchantDashboardMGX() {
  const { merchant, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useNouchi();

  // Chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-orange-600 mx-auto mb-8"></div>
          <p className="text-3xl font-bold text-gray-700">{t.loading}</p>
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
