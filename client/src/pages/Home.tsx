import { useState } from 'react';
import { useLocation } from 'wouter';
import { Wallet, UserCheck, Volume2 } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';

/**
 * Page d'accueil IFN Connect - VERSION SIMPLIFIÉE
 * Interface ultra-simple pour utilisateurs non habitués à l'informatique
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const [audioEnabled] = useState(false);

  const handleRoleSelection = (role: string) => {
    // Feedback sonore si activé
    if (audioEnabled) {
      const audio = new Audio('/sounds/click.mp3');
      audio.play().catch(() => {});
    }
    setLocation(`/${role}`);
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero avec image de fond du marché ivoirien */}
      <div 
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/marche-ivoirien.jpg)',
        }}
      >
        {/* Overlay beige transparent pour lisibilité */}
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

        {/* Contenu */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header institutionnel */}
          <InstitutionalHeader />

          {/* Contenu principal - ULTRA SIMPLIFIÉ */}
          <main className="flex-1 container flex flex-col items-center justify-center py-12 px-4">
            
            {/* Titre simplifié */}
            <div className="text-center mb-16 space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900">
                Bienvenue
              </h1>
              
              <p className="text-3xl md:text-4xl text-gray-700 font-medium">
                Qui êtes-vous ?
              </p>
            </div>

            {/* 2 GROS BOUTONS UNIQUEMENT */}
            <div className="w-full max-w-3xl space-y-8">
              
              {/* MARCHAND - Bouton principal GÉANT */}
              <button
                onClick={() => handleRoleSelection('merchant')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-12 group relative overflow-hidden"
              >
                {/* Badge "Accès principal" */}
                <div className="absolute top-6 right-6 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                  ⭐ Accès principal
                </div>

                <div className="flex flex-col items-center gap-6">
                  {/* Icône GÉANTE */}
                  <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                    <Wallet className="w-32 h-32 text-white" strokeWidth={2.5} />
                  </div>
                  
                  {/* Texte GÉANT */}
                  <div className="space-y-3">
                    <h2 className="text-5xl md:text-6xl font-bold">
                      Je suis Marchand
                    </h2>
                    <p className="text-2xl md:text-3xl text-white/90">
                      Encaisser et vendre
                    </p>
                  </div>

                  {/* Icône audio */}
                  <div className="flex items-center gap-2 text-white/80 text-xl">
                    <Volume2 className="w-8 h-8" />
                    <span>Cliquez pour écouter</span>
                  </div>
                </div>
              </button>

              {/* AGENT TERRAIN - Bouton secondaire GÉANT */}
              <button
                onClick={() => handleRoleSelection('agent')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-12 group"
              >
                <div className="flex flex-col items-center gap-6">
                  {/* Icône GÉANTE */}
                  <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                    <UserCheck className="w-32 h-32 text-white" strokeWidth={2.5} />
                  </div>
                  
                  {/* Texte GÉANT */}
                  <div className="space-y-3">
                    <h2 className="text-5xl md:text-6xl font-bold">
                      Agent terrain
                    </h2>
                    <p className="text-2xl md:text-3xl text-white/90">
                      Aider les marchands
                    </p>
                  </div>

                  {/* Icône audio */}
                  <div className="flex items-center gap-2 text-white/80 text-xl">
                    <Volume2 className="w-8 h-8" />
                    <span>Cliquez pour écouter</span>
                  </div>
                </div>
              </button>

            </div>

            {/* Message d'aide SIMPLIFIÉ */}
            <div className="mt-16 text-center">
              <div className="inline-block bg-blue-100 border-4 border-blue-300 rounded-2xl p-8">
                <p className="text-3xl text-blue-900 font-bold">
                  ❓ Besoin d'aide ?
                </p>
                <p className="text-2xl text-blue-700 mt-2">
                  Demande à ton agent
                </p>
              </div>
            </div>
          </main>

          {/* Footer simplifié */}
          <footer className="container py-8 text-center">
            <div className="inline-block bg-white/80 rounded-xl px-8 py-4">
              <p className="text-xl text-gray-700 font-medium">
                République de Côte d'Ivoire
              </p>
              <p className="text-lg text-gray-600 mt-1">
                DGE • ANSUT • DGI
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
