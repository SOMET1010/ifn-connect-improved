import { useState } from 'react';
import { useLocation } from 'wouter';
import { Volume2 } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { AfricanPattern } from '@/components/ui/african-pattern';

/**
 * Page d'accueil PNAVIM-CI - "L'ÂME DU MARCHÉ"
 * Design inspiré des marchés ivoiriens avec mascottes 3D et motifs Wax
 * Interface humanisée avec glassmorphism et textures africaines
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const [audioEnabled] = useState(false);

  const handleRoleSelection = (role: string) => {
    if (audioEnabled) {
      const audio = new Audio('/sounds/click.mp3');
      audio.play().catch(() => {});
    }
    setLocation(`/${role}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Image de fond du marché ivoirien - ULTRA VIBRANTE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/marche-ivoirien.jpg)',
          filter: 'brightness(0.9) saturate(1.5) contrast(1.1)',
        }}
      />

      {/* Overlay dégradé Terre & Soleil - Plus subtil pour voir le marché */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D35400]/30 via-[#E67E22]/20 to-[#27AE60]/25" />

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

          {/* 2 CARTES GLASSMORPHISM GÉANTES avec mascottes 3D */}
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* MARCHAND - Card principale avec Tantie Sagesse */}
            <button
              onClick={() => handleRoleSelection('merchant')}
              className="backdrop-blur-2xl bg-gradient-to-br from-[#C25E00]/85 via-[#D35400]/80 to-[#E67E22]/85 hover:from-[#A04000]/90 hover:via-[#C25E00]/85 hover:to-[#D35400]/90 text-white rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transform hover:scale-[1.02] transition-all duration-300 p-8 group relative overflow-hidden border-2 border-white/20"
            >
              {/* Motif Wax diagonal en arrière-plan */}
              <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
                <AfricanPattern variant="geometric" opacity={0.5} />
              </div>

              {/* Badge "Accès principal" - Style Jaune Moutarde */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-[#F1C40F] to-[#F39C12] text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg border-2 border-yellow-600/50">
                ⭐ Accès principal
              </div>

              <div className="relative z-10 flex flex-col items-start h-full">
                {/* Texte en haut à gauche */}
                <div className="mb-6">
                  <h2 className="text-4xl font-bold mb-2 text-left leading-tight">
                    Je suis<br />Marchand
                  </h2>
                  <p className="text-lg text-white/90 font-medium text-left">
                    Encaisser, vendre et épargner
                  </p>
                </div>

                {/* Mascotte 3D Tantie Sagesse - En bas à droite */}
                <div className="mt-auto self-end relative">
                  {/* Label "Tantie Sagesse" */}
                  <div className="absolute -top-2 -right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg z-20">
                    <p className="text-[#C25E00] text-sm font-bold whitespace-nowrap">
                      Tantie<br />Sagesse
                    </p>
                  </div>

                  {/* Avatar 3D avec glow */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-2xl scale-110" />
                    <img
                      src="/suta-avatar-3d.png"
                      alt="Tantie Sagesse"
                      className="relative w-48 h-48 object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Bouton vocal au centre bas */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border-2 border-white/30 shadow-xl">
                    <div className="bg-white/30 p-2 rounded-full">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <span className="text-base font-semibold">Cliquez pour écouter</span>
                  </div>
                </div>
              </div>
            </button>

            {/* AGENT TERRAIN - Card secondaire avec mascotte */}
            <button
              onClick={() => handleRoleSelection('agent')}
              className="backdrop-blur-2xl bg-gradient-to-br from-[#2E7D32]/85 via-[#27AE60]/80 to-[#4CAF50]/85 hover:from-[#1B5E20]/90 hover:via-[#2E7D32]/85 hover:to-[#27AE60]/90 text-white rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transform hover:scale-[1.02] transition-all duration-300 p-8 group relative overflow-hidden border-2 border-white/20"
            >
              {/* Motif Géométrique en arrière-plan */}
              <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
                <AfricanPattern variant="wax" opacity={0.5} />
              </div>

              <div className="relative z-10 flex flex-col items-start h-full">
                {/* Texte en haut à gauche */}
                <div className="mb-6">
                  <h2 className="text-4xl font-bold mb-2 text-left leading-tight">
                    Agent<br />terrain
                  </h2>
                  <p className="text-lg text-white/90 font-medium text-left">
                    Accompagner les marchands
                  </p>
                </div>

                {/* Mascotte Agent - En bas à droite */}
                <div className="mt-auto self-end relative">
                  {/* Label "Agent terrain" */}
                  <div className="absolute -top-2 -right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg z-20">
                    <p className="text-[#2E7D32] text-sm font-bold whitespace-nowrap">
                      Agent<br />terrain
                    </p>
                  </div>

                  {/* Pictogramme Agent avec glow */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400/30 rounded-full blur-2xl scale-110" />
                    <img
                      src="/pictograms/agent.png"
                      alt="Agent terrain"
                      className="relative w-48 h-48 object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Bouton vocal au centre bas */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border-2 border-white/30 shadow-xl">
                    <div className="bg-white/30 p-2 rounded-full">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <span className="text-base font-semibold">Agent terrain</span>
                  </div>
                </div>
              </div>
            </button>

          </div>

          {/* Carte Coopérative (petite) - En bas */}
          <div className="mt-12 w-full max-w-5xl">
            <button
              onClick={() => handleRoleSelection('cooperative')}
              className="backdrop-blur-2xl bg-gradient-to-br from-[#D35400]/70 via-[#C25E00]/65 to-[#A04000]/70 text-white rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transform hover:scale-[1.02] transition-all duration-300 p-6 group relative overflow-hidden border-2 border-white/20 w-full max-w-md"
            >
              {/* Motif en arrière-plan */}
              <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
                <AfricanPattern variant="kente" opacity={0.5} />
              </div>

              <div className="relative z-10 flex items-center gap-6">
                {/* Texte */}
                <div className="flex-1 text-left">
                  <h3 className="text-2xl font-bold mb-1">Coopérative</h3>
                  <p className="text-sm text-white/90">Gérer ensemble</p>
                </div>

                {/* Mini mascotte */}
                <div className="relative">
                  <img
                    src="/pictograms/cooperative.png"
                    alt="Coopérative"
                    className="w-20 h-20 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </button>
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
