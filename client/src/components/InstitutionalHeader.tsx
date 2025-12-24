import { useState } from 'react';
import { Volume2, VolumeX, User, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/accessibility/LanguageSelector';
import { audioManager } from '@/lib/audioManager';
import { getLoginUrl } from '@/const';

/**
 * Header institutionnel professionnel pour la plateforme IFN
 * Design classique gouvernemental avec logos regroupés, titre centré, et accessibilité
 */
export default function InstitutionalHeader() {
  const [audioEnabled, setAudioEnabled] = useState(audioManager.isAudioEnabled());
  const [fontSize, setFontSize] = useState(100); // Pourcentage de la taille de base

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    audioManager.setEnabled(newState);
    audioManager.provideFeedback(newState ? 'success' : 'tap');
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 10, 150);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
    audioManager.provideFeedback('tap');
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 10, 80);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
    audioManager.provideFeedback('tap');
  };

  return (
    <header className="bg-white shadow-md relative">
      {/* Ligne colorée décorative en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-green-600" />
      
      <div className="container py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Section gauche : Logos institutionnels regroupés */}
          <div className="flex items-center gap-4">
            <img 
              src="/logos/dge-logo.png" 
              alt="Direction Générale de l'Économie" 
              className="h-14 md:h-16 object-contain"
            />
            <div className="w-px h-14 md:h-16 bg-border" />
            <img 
              src="/logos/ansut-logo.png" 
              alt="Agence Nationale du Service Universel de Télécommunications" 
              className="h-14 md:h-16 object-contain"
            />
          </div>

          {/* Section centre : Titre de la plateforme */}
          <div className="hidden lg:flex flex-1 justify-center">
            <h1 className="text-2xl font-bold text-[#333] leading-tight text-center">
              Plateforme d'Inclusion Numérique
            </h1>
          </div>

          {/* Section droite : Contrôles d'accessibilité et connexion */}
          <div className="flex items-center gap-2">
            {/* Contrôles de taille de texte */}
            <div className="hidden sm:flex items-center gap-1 bg-muted/30 rounded-full p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={decreaseFontSize}
                aria-label="Diminuer la taille du texte"
                className="h-8 w-8 rounded-full hover:bg-accent/20"
                disabled={fontSize <= 80}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium px-2 text-muted-foreground">
                A
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={increaseFontSize}
                aria-label="Augmenter la taille du texte"
                className="h-8 w-8 rounded-full hover:bg-accent/20"
                disabled={fontSize >= 150}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Sélecteur de langue */}
            <LanguageSelector showLabel={false} />

            {/* Toggle audio */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              aria-label={audioEnabled ? 'Désactiver l\'audio' : 'Activer l\'audio'}
              className="h-10 w-10 rounded-full hover:bg-accent/20"
            >
              {audioEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>

            {/* Bouton de connexion */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = getLoginUrl()}
              className="hidden md:flex items-center gap-2 rounded-full px-4 hover:bg-accent/10"
            >
              <User className="h-4 w-4" />
              <span>Se connecter</span>
            </Button>

            {/* Version mobile : icône seulement */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.location.href = getLoginUrl()}
              className="md:hidden h-10 w-10 rounded-full"
              aria-label="Se connecter"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Titre mobile (affiché en dessous sur petits écrans) */}
        <div className="lg:hidden mt-3 text-center">
          <h1 className="text-lg font-bold text-[#333] leading-tight">
            Plateforme d'Inclusion Numérique
          </h1>
        </div>
      </div>
    </header>
  );
}
