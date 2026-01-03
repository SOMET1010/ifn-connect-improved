import { useState } from 'react';
import { useLocation } from 'wouter';
import { Wallet, UserCheck, Volume2 } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { AfricanPattern } from '@/components/ui/african-pattern';

/**
 * Page d'accueil PNAVIM-CI - VERSION SIMPLIFIÉE
 * Plateforme Nationale des Acteurs du Vivrier Marchand
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Image de fond du marché ivoirien - VIBRANTE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/marche-ivoirien.jpg)',
          filter: 'brightness(0.85) saturate(1.3)',
        }}
      />

      {/* Overlay dégradé Terre & Soleil */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-amber-800/30 to-green-900/35" />

      {/* Contenu */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header institutionnel */}
        <InstitutionalHeader />

        {/* Contenu principal - ULTRA SIMPLIFIÉ */}
        <main className="flex-1 container flex flex-col items-center justify-center py-12 px-4">

          {/* Titre simplifié avec motifs */}
          <div className="text-center mb-16 space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 text-[#D35400] opacity-10 scale-150">
                <AfricanPattern variant="wax" opacity={0.3} />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white relative z-10 drop-shadow-2xl [text-shadow:_3px_3px_6px_rgb(0_0_0_/_50%)]">
                Bienvenue
              </h1>
            </div>

            <p className="text-3xl md:text-4xl text-amber-50 font-bold drop-shadow-xl">
              Qui êtes-vous ?
            </p>
          </div>

          {/* 2 GROS BOUTONS UNIQUEMENT */}
          <div className="w-full max-w-3xl space-y-8">

            {/* MARCHAND - Bouton principal GÉANT avec motifs */}
            <button
              onClick={() => handleRoleSelection('merchant')}
              className="w-full backdrop-blur-xl bg-gradient-to-r from-[#D35400] via-[#E67E22] to-[#F39C12] hover:from-[#C0440F] hover:via-[#D35400] hover:to-[#E67E22] text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-12 group relative overflow-hidden border-4 border-amber-600/30"
            >
              {/* Motif Wax en arrière-plan */}
              <div className="absolute inset-0 text-white opacity-10 pointer-events-none">
                <AfricanPattern variant="wax" opacity={0.4} />
              </div>

              {/* Badge "Accès principal" */}
              <div className="absolute top-6 right-6 bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-900 px-6 py-3 rounded-full text-base font-bold flex items-center gap-2 shadow-xl border-2 border-yellow-500/50">
                ⭐ Accès principal
              </div>

              <div className="flex flex-col items-center gap-6 relative z-10">
                {/* Icône GÉANTE avec motif */}
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
                  <div className="relative bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors border-4 border-white/30">
                    <Wallet className="w-32 h-32 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Texte GÉANT */}
                <div className="space-y-3">
                  <h2 className="text-5xl md:text-6xl font-bold drop-shadow-2xl">
                    Je suis Marchand
                  </h2>
                  <p className="text-2xl md:text-3xl text-white/90 font-semibold drop-shadow-lg">
                    Encaisser et vendre
                  </p>
                </div>

                {/* Icône audio */}
                <div className="flex items-center gap-2 text-white/90 text-xl font-semibold bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                  <Volume2 className="w-8 h-8" />
                  <span>Cliquez pour écouter</span>
                </div>
              </div>
            </button>

            {/* AGENT TERRAIN - Bouton secondaire GÉANT avec motifs */}
            <button
              onClick={() => handleRoleSelection('agent')}
              className="w-full backdrop-blur-xl bg-gradient-to-r from-[#27AE60] to-[#10B981] hover:from-[#1E8449] hover:to-[#059669] text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 p-12 group relative overflow-hidden border-4 border-green-600/30"
            >
              {/* Motif Géométrique en arrière-plan */}
              <div className="absolute inset-0 text-white opacity-10 pointer-events-none">
                <AfricanPattern variant="geometric" opacity={0.4} />
              </div>

              <div className="flex flex-col items-center gap-6 relative z-10">
                {/* Icône GÉANTE avec motif */}
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
                  <div className="relative bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors border-4 border-white/30">
                    <UserCheck className="w-32 h-32 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Texte GÉANT */}
                <div className="space-y-3">
                  <h2 className="text-5xl md:text-6xl font-bold drop-shadow-2xl">
                    Agent terrain
                  </h2>
                  <p className="text-2xl md:text-3xl text-white/90 font-semibold drop-shadow-lg">
                    Aider les marchands
                  </p>
                </div>

                {/* Icône audio */}
                <div className="flex items-center gap-2 text-white/90 text-xl font-semibold bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                  <Volume2 className="w-8 h-8" />
                  <span>Cliquez pour écouter</span>
                </div>
              </div>
            </button>

          </div>

          {/* Message d'aide avec motifs */}
          <div className="mt-16 text-center">
            <div className="inline-block backdrop-blur-xl bg-blue-500/90 border-4 border-blue-400/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              {/* Motif Kente */}
              <div className="absolute inset-0 text-white opacity-10 pointer-events-none">
                <AfricanPattern variant="kente" opacity={0.4} />
              </div>
              <div className="relative z-10">
                <p className="text-3xl text-white font-bold drop-shadow-lg">
                  ❓ Besoin d'aide ?
                </p>
                <p className="text-2xl text-blue-50 mt-2 font-semibold">
                  Demande à ton agent
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer avec glassmorphism */}
        <footer className="container py-8 text-center relative z-10">
          <div className="inline-block backdrop-blur-xl bg-white/90 rounded-2xl px-10 py-6 shadow-2xl border-2 border-amber-200/50 relative overflow-hidden">
            {/* Motif subtil */}
            <div className="absolute inset-0 text-[#D35400] opacity-5 pointer-events-none">
              <AfricanPattern variant="geometric" opacity={0.3} />
            </div>
            <div className="relative z-10">
              <p className="text-xl text-gray-800 font-bold">
                République de Côte d'Ivoire
              </p>
              <p className="text-lg text-gray-600 mt-1 font-semibold">
                DGE • ANSUT
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
