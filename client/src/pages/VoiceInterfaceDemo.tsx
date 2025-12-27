import { useAutoPlay } from '../hooks/useAutoPlay';
import { AudioButton } from '../components/AudioButton';
import { trpc } from '../lib/trpc';
import { Card } from '../components/ui/card';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  HelpCircle,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Page de démonstration de l'interface 100% vocale
 * 
 * Caractéristiques :
 * - Lecture automatique au chargement
 * - Pictogrammes XXL (min 80x80px)
 * - Texte minimal ou masqué
 * - Feedback audio sur chaque action
 * - Navigation vocale
 */
export default function VoiceInterfaceDemo() {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [textVisible, setTextVisible] = useState(false);

  // Lecture automatique au chargement
  const { play, isPlaying, pause, resume } = useAutoPlay(
    ['welcome.home', 'instruction.select_product'],
    audioEnabled,
    1000 // 1 seconde de délai
  );

  // Charger les préférences
  useEffect(() => {
    const savedAudioPref = localStorage.getItem('audioEnabled');
    if (savedAudioPref !== null) {
      setAudioEnabled(savedAudioPref === 'true');
    }
  }, []);

  // Sauvegarder les préférences
  const toggleAudio = () => {
    const newValue = !audioEnabled;
    setAudioEnabled(newValue);
    localStorage.setItem('audioEnabled', String(newValue));
    
    if (!newValue && isPlaying) {
      pause();
    }
  };

  const handleSell = () => {
    console.log('Action: Vendre');
    // Simuler une vente
  };

  const handleStock = () => {
    console.log('Action: Stock');
  };

  const handleMoney = () => {
    console.log('Action: Argent');
  };

  const handleHelp = () => {
    console.log('Action: Aide');
    // Rejouer les instructions
    play(['instruction.voice_command', 'instruction.select_product']);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 p-4">
      {/* Header avec contrôles */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Interface Vocale 100%
              </h1>
              {isPlaying && (
                <div className="flex items-center gap-2 text-orange-600 animate-pulse">
                  <Volume2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Audio en cours...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Toggle texte visible */}
              <button
                onClick={() => setTextVisible(!textVisible)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                {textVisible ? '👁️ Texte visible' : '🙈 Texte masqué'}
              </button>

              {/* Toggle audio */}
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-lg transition-all ${
                  audioEnabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {audioEnabled ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <VolumeX className="w-6 h-6" />
                )}
              </button>

              {/* Contrôle lecture */}
              {isPlaying ? (
                <button
                  onClick={pause}
                  className="p-3 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                >
                  <Pause className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={resume}
                  className="p-3 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                >
                  <Play className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Grille de boutons principaux */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bouton Vendre */}
          <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-500 to-orange-600">
            <AudioButton
              audioKey="button.sell"
              icon={<ShoppingCart className="w-20 h-20" />}
              onClick={handleSell}
              size="xl"
              className="w-full h-40 flex-col gap-4 bg-white/20 hover:bg-white/30 border-0 text-white"
            >
              {textVisible && (
                <span className="text-2xl font-bold">Vendre</span>
              )}
            </AudioButton>
          </Card>

          {/* Bouton Stock */}
          <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-500 to-blue-600">
            <AudioButton
              audioKey="button.stock"
              icon={<Package className="w-20 h-20" />}
              onClick={handleStock}
              size="xl"
              className="w-full h-40 flex-col gap-4 bg-white/20 hover:bg-white/30 border-0 text-white"
            >
              {textVisible && (
                <span className="text-2xl font-bold">Mon Stock</span>
              )}
            </AudioButton>
          </Card>

          {/* Bouton Argent */}
          <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-500 to-green-600">
            <AudioButton
              audioKey="button.money"
              icon={<DollarSign className="w-20 h-20" />}
              onClick={handleMoney}
              size="xl"
              className="w-full h-40 flex-col gap-4 bg-white/20 hover:bg-white/30 border-0 text-white"
            >
              {textVisible && (
                <span className="text-2xl font-bold">Mon Argent</span>
              )}
            </AudioButton>
          </Card>

          {/* Bouton Aide */}
          <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-500 to-purple-600">
            <AudioButton
              audioKey="nav.go_to_profile"
              icon={<HelpCircle className="w-20 h-20" />}
              onClick={handleHelp}
              size="xl"
              className="w-full h-40 flex-col gap-4 bg-white/20 hover:bg-white/30 border-0 text-white"
            >
              {textVisible && (
                <span className="text-2xl font-bold">Aide</span>
              )}
            </AudioButton>
          </Card>
        </div>

        {/* Message d'information */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <Volume2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-2">
                Interface 100% Vocale
              </h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Cette interface est conçue pour être utilisée <strong>sans savoir lire</strong>. 
                Chaque bouton joue un audio en Dioula quand vous cliquez dessus. 
                Les pictogrammes sont XXL (80x80px minimum) et les couleurs sont distinctives.
              </p>
              <p className="text-blue-800 text-sm mt-2">
                💡 <strong>Astuce :</strong> Cliquez sur "Texte masqué" pour voir l'interface 
                telle qu'elle sera utilisée par les marchands non-alphabétisés.
              </p>
            </div>
          </div>
        </Card>

        {/* Statistiques de la bibliothèque audio */}
        <AudioLibraryStats />
      </div>
    </div>
  );
}

/**
 * Composant pour afficher les statistiques de la bibliothèque audio
 */
function AudioLibraryStats() {
  const { data: stats } = trpc.audioLibrary.getStats.useQuery();

  if (!stats) return null;

  return (
    <Card className="mt-8 p-6">
      <h3 className="font-bold text-gray-900 mb-4">
        📊 Statistiques de la bibliothèque audio
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600">
            {stats.totalAudios}
          </div>
          <div className="text-sm text-gray-600">Messages</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {stats.withTranslation}
          </div>
          <div className="text-sm text-gray-600">Traductions</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {stats.totalDuration}s
          </div>
          <div className="text-sm text-gray-600">Durée totale</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">
            {stats.completionRate}%
          </div>
          <div className="text-sm text-gray-600">Complétion</div>
        </div>
      </div>
    </Card>
  );
}
