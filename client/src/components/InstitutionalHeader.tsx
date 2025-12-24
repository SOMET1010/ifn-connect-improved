import { useState, useEffect } from 'react';
import { Volume2, VolumeX, User, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/accessibility/LanguageSelector';
import { audioManager } from '@/lib/audioManager';
import { getLoginUrl } from '@/const';

/**
 * Header institutionnel optimisé pour ANSUT / IFN
 * Inclus : Persistance des préférences, Sticky mode, et Accessibilité AA+
 */
export default function InstitutionalHeader() {
  // --- ÉTATS AVEC PERSISTANCE ---
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(() => {
    // Vérifier le localStorage ou l'état par défaut de l'audioManager
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ifn-audio-pref');
        return saved !== null ? JSON.parse(saved) : audioManager.isAudioEnabled();
    }
    return true;
  });

  // Font Size state
  const [fontSize, setFontSize] = useState(100);

  // --- EFFETS (SIDE EFFECTS) ---

  // Initialisation et persistance de la taille de police
  useEffect(() => {
    const savedSize = localStorage.getItem('ifn-font-size');
    if (savedSize) {
      const size = parseInt(savedSize);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}%`;
    }
  }, []);

  // Gestion du Toggle Audio
  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    audioManager.setEnabled(newState);
    localStorage.setItem('ifn-audio-pref', JSON.stringify(newState));
    
    if (newState) {
        audioManager.provideFeedback('success'); 
    }
  };

  // Gestion de la taille du texte
  const adjustFontSize = (adjustment: number) => {
    const newSize = Math.max(80, Math.min(fontSize + adjustment, 150)); // Bornes 80% - 150%
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
    localStorage.setItem('ifn-font-size', newSize.toString());
    audioManager.provideFeedback('tap');
  };

  return (
    // Ajout de 'sticky top-0 z-50' pour garder le header visible au scroll
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md transition-all duration-300 relative overflow-hidden">
      
      {/* Image de fond marché ivoirien avec opacité modérée */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.18] pointer-events-none"
        style={{ backgroundImage: 'url(/marche-ivoirien.jpg)' }}
      />
      
      {/* Dégradé blanc sur les côtés pour fondre l'image */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-white/60 pointer-events-none" />
      
      {/* Ligne tricolore institutionnelle (Clin d'œil subtil CIV/Emergence) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-white to-green-600 opacity-80" />
      
      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          
          {/* --- ZONE GAUCHE : IDENTITÉ --- */}
          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            {/* Logos avec protection de ratio */}
            <div className="flex items-center gap-3 md:gap-4 h-12 md:h-16">
              <img 
                 src="/logos/dge-logo.png" 
                 alt="Logo DGE" 
                 className="h-full w-auto object-contain"
                 onError={(e) => e.currentTarget.style.display = 'none'} // Fallback simple
              />
              {/* Séparateur vertical */}
              <div className="w-px h-8 md:h-12 bg-gray-300" />
              <img 
                 src="/logos/ansut-logo.png" 
                 alt="Logo ANSUT" 
                 className="h-full w-auto object-contain"
                 onError={(e) => e.currentTarget.style.display = 'none'}
              />
            </div>
          </div>

          {/* --- ZONE CENTRE : TITRE (Desktop) --- */}
          <div className="hidden lg:flex flex-1 justify-center items-center">
            <h1 className="text-xl xl:text-2xl font-bold text-gray-800 tracking-tight text-center uppercase">
              Plateforme d'Inclusion Numérique
            </h1>
          </div>

          {/* --- ZONE DROITE : OUTILS --- */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* Widget Accessibilité (Taille texte) - Visible dès Tablette */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustFontSize(-10)}
                aria-label="Diminuer texte"
                className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm transition-all"
                disabled={fontSize <= 80}
              >
                <Minus className="h-3.5 w-3.5 text-gray-600" />
              </Button>
              <span className="text-[10px] font-bold px-1.5 text-gray-500 min-w-[2.5ch] text-center">
                {fontSize === 100 ? 'A' : `${fontSize}%`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustFontSize(10)}
                aria-label="Augmenter texte"
                className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm transition-all"
                disabled={fontSize >= 150}
              >
                <Plus className="h-3.5 w-3.5 text-gray-600" />
              </Button>
            </div>

            {/* Séparateur léger */}
            <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

            {/* Langue */}
            <LanguageSelector />

            {/* Audio Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              title={audioEnabled ? "Désactiver les sons" : "Activer les sons"}
              className={`h-9 w-9 rounded-full transition-colors ${
                audioEnabled ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>

            {/* Connexion (Mise en avant) */}
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="hidden md:flex items-center gap-2 rounded-full px-5 bg-[#000] hover:bg-[#333] text-white shadow-sm hover:shadow transition-all ml-2"
            >
              <User className="h-4 w-4" />
              <span className="font-medium">Espace Agent</span>
            </Button>

            {/* Mobile Menu / Login Icon Only */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.location.href = getLoginUrl()}
              className="md:hidden h-9 w-9 rounded-full border-gray-300"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* --- MOBILE ONLY : TITRE --- */}
        {/* Affiché uniquement sur mobile pour préserver l'espace en haut */}
        <div className="lg:hidden mt-3 pb-1 border-t border-dashed border-gray-100 pt-3 text-center">
             <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
               Plateforme d'Inclusion Numérique
             </span>
        </div>
      </div>
    </header>
  );
}
