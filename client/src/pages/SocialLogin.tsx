import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Phone, Mic, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { DeviceFingerprint } from '@/lib/deviceFingerprint';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

type LoginStep = 'phone' | 'challenge' | 'approved' | 'agent_required';
type Persona = 'tantie' | 'jeune' | 'neutral';

const PERSONA_MESSAGES = {
  tantie: {
    welcome: "C'est qui est là ? Dis-moi ton numéro ma fille.",
    enterPhone: "Écris ton numéro doucement, y'a pas de problème.",
    challenge: "Je te reconnais pas bien aujourd'hui. Pour continuer, réponds à cette question ma fille:",
    success: "Bonne arrivée ma fille! Entre, on va gérer ton commerce.",
    error: "Je ne te reconnais pas bien aujourd'hui. On va appeler un agent pour t'aider, ne quitte pas.",
  },
  jeune: {
    welcome: "C'est qui est là ? Dis-moi ton numéro mon vieux.",
    enterPhone: "Tape ton numéro chap-chap.",
    challenge: "Je te reconnais pas bien. Réponds à cette question là:",
    success: "C'est validé! Y'a pas drap, entre.",
    error: "Je te reconnais pas. On va appeler un agent, patiente petit.",
  },
  neutral: {
    welcome: "C'est qui est là ? Dis-moi ton numéro.",
    enterPhone: "Entre ton numéro de téléphone.",
    challenge: "Je te reconnais pas bien aujourd'hui. Réponds à cette question:",
    success: "Bonne arrivée! Bienvenue.",
    error: "Je ne te reconnais pas. On va appeler un agent pour t'aider.",
  },
};

export default function SocialLogin() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [challenge, setChallenge] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [persona, setPersona] = useState<Persona>('neutral');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  useEffect(() => {
    const initDevice = async () => {
      const fingerprint = await DeviceFingerprint.getPersistentId();
      setDeviceFingerprint(fingerprint);
    };
    initDevice();
  }, []);

  const detectPersona = (phone: string): Persona => {
    const lastDigit = parseInt(phone.slice(-1));
    if (lastDigit % 2 === 0) {
      return 'tantie';
    } else {
      return 'jeune';
    }
  };

  const initiateMutation = trpc.socialAuth.initiateLogin.useMutation({
    onSuccess: (data) => {
      if (data.status === 'APPROVED') {
        toast.success(PERSONA_MESSAGES[persona].success);
        setTimeout(() => {
          setLocation('/merchant/dashboard');
        }, 1500);
        setStep('approved');
      } else if (data.status === 'CHALLENGE_REQUIRED') {
        setChallenge(data.challenge);
        setStep('challenge');
        toast.info(PERSONA_MESSAGES[persona].challenge);
      } else if (data.status === 'FALLBACK_AGENT') {
        setStep('agent_required');
        toast.error(PERSONA_MESSAGES[persona].error);
      }
    },
    onError: (error) => {
      setError(error.message);
      toast.error(error.message);
    },
  });

  const answerMutation = trpc.socialAuth.answerChallenge.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(PERSONA_MESSAGES[persona].success);
        setTimeout(() => {
          setLocation('/merchant/dashboard');
        }, 1500);
        setStep('approved');
      } else {
        setStep('agent_required');
        toast.error(data.message);
      }
    },
    onError: (error) => {
      setError(error.message);
      toast.error(error.message);
    },
  });

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length < 8) {
      setError('Entre un numéro valide (minimum 8 chiffres)');
      return;
    }

    const detectedPersona = detectPersona(phone);
    setPersona(detectedPersona);

    let latitude: number | undefined;
    let longitude: number | undefined;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: false,
        });
      });
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
    } catch (error) {
      console.log('GPS non disponible, continuons sans...');
    }

    initiateMutation.mutate({
      phone,
      deviceFingerprint,
      latitude,
      longitude,
      ipAddress: undefined,
      userAgent: navigator.userAgent,
    });
  };

  const handleChallengeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!answer || answer.trim().length === 0) {
      setError('Entre ta réponse');
      return;
    }

    answerMutation.mutate({
      phone,
      challengeId: challenge.id,
      answer: answer.trim(),
      deviceFingerprint,
    });
  };

  const messages = PERSONA_MESSAGES[persona];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-6xl">👋</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            {messages.welcome}
          </h1>
          <p className="text-xl text-gray-600">IFN Connect - PNAVIM</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'phone' && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Connexion Sécurisée</CardTitle>
              <CardDescription className="text-center text-lg">
                {messages.enterPhone}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-lg">Numéro de téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Ex: 0123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-lg h-14 pl-12"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600"
                  disabled={initiateMutation.isPending}
                >
                  {initiateMutation.isPending ? 'Connexion...' : 'Continuer'}
                </Button>

                {isVoiceMode && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 text-lg"
                    onClick={() => setIsVoiceMode(false)}
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Mode Vocal (bientôt disponible)
                  </Button>
                )}
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Pas encore inscrit ?{' '}
                  <span className="text-orange-600 font-semibold">
                    Contacte ton agent terrain
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'challenge' && challenge && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Question de Sécurité</CardTitle>
              <CardDescription className="text-center text-lg">
                {messages.challenge}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChallengeSubmit} className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-xl font-semibold text-gray-900 text-center">
                    {challenge.questionFr}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer" className="text-lg">Ta réponse</Label>
                  <Input
                    id="answer"
                    type="text"
                    placeholder="Entre ta réponse ici..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="text-lg h-14"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600"
                  disabled={answerMutation.isPending}
                >
                  {answerMutation.isPending ? 'Vérification...' : 'Valider'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 text-lg"
                  onClick={() => {
                    setStep('phone');
                    setChallenge(null);
                    setAnswer('');
                  }}
                >
                  Retour
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'approved' && (
          <Card className="shadow-xl bg-gradient-to-br from-green-50 to-green-100 border-green-300">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-8xl mb-6">✅</div>
              <h2 className="text-3xl font-bold text-green-900 mb-4">
                {messages.success}
              </h2>
              <p className="text-xl text-green-700">Redirection en cours...</p>
            </CardContent>
          </Card>
        )}

        {step === 'agent_required' && (
          <Card className="shadow-xl bg-gradient-to-br from-red-50 to-red-100 border-red-300">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-8xl mb-6">📞</div>
              <h2 className="text-3xl font-bold text-red-900 mb-4">
                {messages.error}
              </h2>
              <p className="text-xl text-red-700 mb-6">
                Un agent va te contacter très bientôt.
              </p>
              <Button
                variant="outline"
                className="text-lg h-14 px-8"
                onClick={() => {
                  setStep('phone');
                  setPhone('');
                  setError('');
                }}
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 rounded-full shadow-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-700">
              Authentification Sociale Sécurisée
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
