import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { audioManager } from '../lib/audioManager';
import { elevenLabsVoice } from '../lib/elevenLabsVoice';
import { VOICE_PERSONAS, type VoicePersona } from '../../../shared/voice-personas';

export function VoicePersonaSelector() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<VoicePersona | null>(null);

  useEffect(() => {
    checkConfiguration();
    setUseElevenLabs(audioManager.getUseElevenLabs());
  }, []);

  const checkConfiguration = async () => {
    const config = await elevenLabsVoice.checkConfiguration();
    setIsConfigured(config.isConfigured);
  };

  const handleToggleElevenLabs = (enabled: boolean) => {
    setUseElevenLabs(enabled);
    audioManager.setUseElevenLabs(enabled);
  };

  const handleTestPersona = async (persona: VoicePersona) => {
    if (isPlaying) return;

    setIsPlaying(true);
    setCurrentPersona(persona);

    try {
      const testMessages = {
        tantie: 'Bonjour. Je suis Tantie Sagesse. Je suis là pour vous accompagner dans votre parcours avec PNAVIM.',
        pro: 'Bonjour. Je suis Le Pro. Votre solde actuel est de 50 000 francs CFA.',
        ambianceur: 'Eh gars ! Tu es un champion ! Continue comme ça, tu vas casser le marché !',
      };

      await audioManager.speak(testMessages[persona], 'information');
    } catch (error) {
      console.error('Error testing persona:', error);
    } finally {
      setIsPlaying(false);
      setCurrentPersona(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Configuration Vocale
            {isConfigured ? (
              <Badge variant="default" className="bg-green-500">
                <Check className="w-3 h-3 mr-1" />
                Configuré
              </Badge>
            ) : (
              <Badge variant="destructive">Non configuré</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isConfigured
              ? 'Les voix authentiques ElevenLabs sont prêtes à être utilisées'
              : 'Ajoutez vos clés API ElevenLabs dans le fichier .env pour activer les voix authentiques'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Voix ElevenLabs (Authentiques)</div>
              <div className="text-xs text-muted-foreground">
                Utiliser les voix clonées d'acteurs ivoiriens
              </div>
            </div>
            <Switch
              checked={useElevenLabs}
              onCheckedChange={handleToggleElevenLabs}
              disabled={!isConfigured}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.values(VOICE_PERSONAS).map((persona) => (
          <Card key={persona.id} className="relative">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                {persona.name}
              </CardTitle>
              <CardDescription>{persona.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Tonalité</div>
                <div className="text-sm">{persona.tonality}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Cas d'usage
                </div>
                <ul className="text-xs space-y-1">
                  {persona.useCases.slice(0, 3).map((useCase, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleTestPersona(persona.id)}
                disabled={isPlaying || !isConfigured}
              >
                {isPlaying && currentPersona === persona.id ? (
                  <>
                    <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                    En lecture...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Écouter
                  </>
                )}
              </Button>
            </CardContent>

            {isPlaying && currentPersona === persona.id && (
              <div className="absolute inset-0 bg-primary/5 rounded-lg animate-pulse" />
            )}
          </Card>
        ))}
      </div>

      {!isConfigured && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200 text-base">
              Configuration requise
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-700 dark:text-yellow-300">
            <div className="space-y-2">
              <p>Pour activer les voix authentiques ElevenLabs, suivez ces étapes :</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Créez un compte sur ElevenLabs.io</li>
                <li>Enregistrez 3 acteurs ivoiriens (Tantie, Pro, Ambianceur)</li>
                <li>Créez les clones vocaux (Professional Voice Cloning)</li>
                <li>Ajoutez les clés API et Voice IDs dans le fichier .env</li>
                <li>Redémarrez l'application</li>
              </ol>
              <p className="mt-3 text-xs">
                En attendant, le système utilisera la synthèse vocale du navigateur comme solution de
                secours.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
