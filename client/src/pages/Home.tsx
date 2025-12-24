import { useState } from 'react';
import { useLocation } from 'wouter';
import { Globe, Volume2, VolumeX, Wallet, UserCheck, Building2, ShieldCheck } from 'lucide-react';
import ActionCard from '@/components/accessibility/ActionCard';
import LanguageSelector from '@/components/accessibility/LanguageSelector';
import AudioButton from '@/components/accessibility/AudioButton';
import { audioManager } from '@/lib/audioManager';
import { Button } from '@/components/ui/button';

/**
 * Page d'accueil IFN Connect
 * Sélection du rôle utilisateur avec Hero image du marché ivoirien
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const [audioEnabled, setAudioEnabled] = useState(audioManager.isAudioEnabled());

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    audioManager.setEnabled(newState);
    audioManager.provideFeedback(newState ? 'success' : 'tap');
  };

  const handleRoleSelection = (role: string) => {
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
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />

        {/* Contenu */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header avec logos et contrôles */}
          <header className="container py-6">
            <div className="flex items-center justify-between">
              {/* Logos institutionnels */}
              <div className="flex items-center gap-6">
                <img 
                  src="/logos/partners.png" 
                  alt="DGE & ANSUT" 
                  className="h-10 md:h-12 object-contain"
                />
              </div>

              {/* Contrôles */}
              <div className="flex items-center gap-2">
                {/* Sélecteur de langue */}
                <LanguageSelector showLabel={false} />

                {/* Toggle audio */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleAudio}
                  aria-label={audioEnabled ? 'Désactiver l\'audio' : 'Activer l\'audio'}
                  className="h-10 w-10"
                >
                  {audioEnabled ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </header>

          {/* Contenu principal */}
          <main className="flex-1 container flex flex-col items-center justify-center py-12">
            {/* Titre et description */}
            <div className="text-center mb-12 space-y-4 animate-fade-in">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Globe className="h-12 w-12 text-primary" />
                <AudioButton 
                  instructionKey="welcome" 
                  size="lg"
                  variant="default"
                />
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance">
                Plateforme IFN
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground text-balance">
                Pour les marchands du vivrier
              </p>

              <div className="inline-block px-4 py-2 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  République de Côte d'Ivoire
                </p>
                <p className="text-xs text-muted-foreground">
                  DGE • ANSUT • DGI
                </p>
              </div>
            </div>

            {/* Sélection du rôle */}
            <div className="w-full max-w-4xl space-y-6 animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Qui êtes-vous ?
                </h2>
                <p className="text-muted-foreground">
                  Choisissez votre accès pour continuer
                </p>
              </div>

              {/* Grille de cartes de rôles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marchand - Accès principal */}
                <ActionCard
                  title="Je suis Marchand"
                  description="Encaisser et vendre sans souci"
                  icon={Wallet}
                  audioKey="sell"
                  onClick={() => handleRoleSelection('merchant')}
                  variant="primary"
                  size="lg"
                  badge="⭐ Accès principal"
                />

                {/* Agent terrain */}
                <ActionCard
                  title="Agent terrain"
                  description="Aider les marchands"
                  icon={UserCheck}
                  audioKey="enroll"
                  onClick={() => handleRoleSelection('agent')}
                  variant="secondary"
                  size="lg"
                />

                {/* Coopérative */}
                <ActionCard
                  title="Coopérative"
                  description="Gérer les commandes groupées"
                  icon={Building2}
                  audioKey="cooperative"
                  onClick={() => handleRoleSelection('cooperative')}
                  variant="secondary"
                  size="lg"
                />

                {/* Administration */}
                <ActionCard
                  title="Administration"
                  description="Superviser la plateforme"
                  icon={ShieldCheck}
                  audioKey="admin"
                  onClick={() => handleRoleSelection('admin')}
                  variant="secondary"
                  size="lg"
                />
              </div>

              {/* Message d'aide */}
              <div className="text-center mt-8 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ❓ Tu hésites ? Demande à ton agent ou ta coopérative.
                </p>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="container py-6 text-center text-sm text-muted-foreground">
            <p>
              Plateforme d'Inclusion Financière Numérique
            </p>
            <p className="mt-1">
              Développée avec le soutien de la DGE et l'ANSUT
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
