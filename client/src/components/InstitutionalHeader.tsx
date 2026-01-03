import { useState, useEffect } from 'react';
import { Volume2, VolumeX, User, Plus, Minus, LogOut, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/accessibility/LanguageSelector';
import { audioManager } from '@/lib/audioManager';
import { useAuth, getLoginUrl } from '@/hooks/useAuth';
import { SessionStatusBadge } from '@/components/SessionStatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

/**
 * Header institutionnel PNAVIM-CI
 * Plateforme Nationale des Acteurs du Vivrier Marchand - Côte d'Ivoire
 * Inclus : Persistance des préférences, Sticky mode, et Accessibilité AA+
 */
export default function InstitutionalHeader() {
  const { user, merchant, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
            {/* Logo PNAVIM-CI */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex flex-col">
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-[#C25E00] to-[#E67E22] bg-clip-text text-transparent leading-tight">PNAVIM-CI</h1>
                <p className="text-[10px] md:text-xs text-[#636E72] leading-tight hidden sm:block">Plateforme Nationale des Acteurs du Vivrier Marchand</p>
              </div>
            </div>
          </div>

          {/* --- ZONE CENTRE : NAVIGATION (Desktop) --- */}
          <nav className="hidden lg:flex flex-1 justify-center items-center gap-6">
            <a href="/" className="text-sm font-medium text-gray-700 hover:text-[#C25E00] transition-colors">Accueil</a>
            <a href="/actors" className="text-sm font-medium text-gray-700 hover:text-[#C25E00] transition-colors">Acteurs</a>
            <a href="/marketplace" className="text-sm font-medium text-gray-700 hover:text-[#C25E00] transition-colors">Marché</a>
            <a href="/payments" className="text-sm font-medium text-gray-700 hover:text-[#C25E00] transition-colors">Paiements</a>
            <a href="/api" className="text-sm font-medium text-gray-700 hover:text-[#C25E00] transition-colors">API</a>
            <a href="/support" className="text-sm font-medium text-gray-700 hover:text-[#C25E00] transition-colors">Support</a>
          </nav>

          {/* --- BOUTON HAMBURGER (Mobile) --- */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-9 w-9"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

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

            {/* Badge Statut de Journée (pour marchands uniquement) */}
            {isAuthenticated && user?.role === 'merchant' && <SessionStatusBadge />}

            {/* Menu Utilisateur ou Connexion */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="hidden md:flex items-center gap-2 rounded-full px-5 bg-gradient-to-r from-[#C25E00] to-[#E67E22] hover:from-[#A04000] hover:to-[#D35400] text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all ml-2 border-2 border-[#F39C12]/30"
                  >
                    <User className="h-4 w-4" />
                    <span className="font-semibold">{user?.name || 'Utilisateur'}</span>
                    {user?.role && (
                      <span className="ml-1 px-2 py-0.5 text-[10px] bg-yellow-400 text-yellow-900 rounded-full font-bold">
                        {user.role === 'merchant' ? 'Marchand' : user.role === 'agent' ? 'Agent' : 'Admin'}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.name || 'Utilisateur'}</span>
                      {merchant && (
                        <span className="text-xs text-gray-500">{merchant.merchantNumber}</span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="hidden md:flex items-center gap-2 rounded-full px-6 py-2 bg-gradient-to-r from-[#F1C40F] to-[#F39C12] hover:from-[#F39C12] hover:to-[#E67E22] text-yellow-900 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all ml-2 border-2 border-yellow-600/30"
              >
                <User className="h-4 w-4" />
                <span className="font-semibold">Se connecter</span>
              </Button>
            )}

            {/* Mobile Menu / Login Icon Only */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden h-9 w-9 rounded-full border-gray-300"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.name || 'Utilisateur'}</span>
                      {merchant && (
                        <span className="text-xs text-gray-500">{merchant.merchantNumber}</span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.location.href = getLoginUrl()}
                className="md:hidden h-9 w-9 rounded-full border-gray-300"
              >
                <User className="h-5 w-5" />
              </Button>
            )}
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

      {/* --- MENU MOBILE DÉROULANT --- */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <a
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-[#FFF5E6] hover:text-[#C25E00] rounded-lg transition-colors"
            >
              Accueil
            </a>
            <a
              href="/actors"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-[#FFF5E6] hover:text-[#C25E00] rounded-lg transition-colors"
            >
              Acteurs
            </a>
            <a
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-[#FFF5E6] hover:text-[#C25E00] rounded-lg transition-colors"
            >
              Marché
            </a>
            <a
              href="/payments"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-[#FFF5E6] hover:text-[#C25E00] rounded-lg transition-colors"
            >
              Paiements
            </a>
            <a
              href="/api"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-[#FFF5E6] hover:text-[#C25E00] rounded-lg transition-colors"
            >
              API
            </a>
            <a
              href="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-[#FFF5E6] hover:text-[#C25E00] rounded-lg transition-colors"
            >
              Support
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
