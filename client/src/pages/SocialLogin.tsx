import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Phone, Mic, AlertCircle, Smile } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { DeviceFingerprint } from '@/lib/deviceFingerprint';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AfricanPattern } from '@/components/ui/african-pattern';
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
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/marche-ivoirien.jpg)',
          filter: 'brightness(0.85) saturate(1.2)',
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-amber-800/30 to-green-900/40" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D35400] via-[#E67E22] to-[#F39C12] rounded-full shadow-2xl" />
              <div className="absolute inset-2 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 text-[#D35400]">
                    <AfricanPattern variant="wax" opacity={0.15} />
                  </div>
                  <span className="text-7xl relative z-10">👋</span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
              {messages.welcome}
            </h1>
            <p className="text-2xl text-amber-100 font-semibold drop-shadow-md">IFN Connect - PNAVIM</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 backdrop-blur-sm bg-red-900/80 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-white font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {step === 'phone' && (
            <Card className="shadow-2xl backdrop-blur-xl bg-white/95 border-2 border-amber-200/50 overflow-hidden">
              <div className="absolute inset-0 text-[#D35400] opacity-5 pointer-events-none">
                <AfricanPattern variant="geometric" opacity={0.3} />
              </div>

              <CardHeader className="relative bg-gradient-to-r from-[#D35400] to-[#E67E22] text-white pb-8">
                <div className="absolute inset-0 text-white opacity-10">
                  <AfricanPattern variant="wax" opacity={0.4} />
                </div>
                <CardTitle className="text-2xl text-center relative z-10 drop-shadow-md">
                  Connexion Sécurisée
                </CardTitle>
                <CardDescription className="text-center text-xl text-amber-50 relative z-10 mt-2 font-medium">
                  {messages.enterPhone}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-8 pb-8 relative">
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-lg font-semibold text-gray-800">
                      Numéro de téléphone
                    </Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#D35400] w-6 h-6 group-focus-within:scale-110 transition-transform" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Ex: 0123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="text-xl h-16 pl-14 pr-4 border-2 border-amber-200 focus:border-[#D35400] focus:ring-2 focus:ring-[#E67E22]/30 rounded-2xl bg-amber-50/50 font-semibold transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-[#D35400] via-[#E67E22] to-[#F39C12] hover:from-[#C0440F] hover:via-[#D35400] hover:to-[#E67E22] shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-amber-600/30"
                    disabled={initiateMutation.isPending}
                  >
                    {initiateMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        Connexion...
                      </span>
                    ) : (
                      'Continuer'
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border-2 border-amber-200/50 shadow-md">
                    <Smile className="w-5 h-5 text-[#D35400]" />
                    <p className="text-sm font-semibold text-gray-700">
                      Pas encore inscrit ?{' '}
                      <span className="text-[#D35400] font-bold">
                        Contacte ton agent terrain
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'challenge' && challenge && (
            <Card className="shadow-2xl backdrop-blur-xl bg-white/95 border-2 border-blue-200/50 overflow-hidden">
              <div className="absolute inset-0 text-blue-600 opacity-5 pointer-events-none">
                <AfricanPattern variant="kente" opacity={0.3} />
              </div>

              <CardHeader className="relative bg-gradient-to-r from-blue-600 to-blue-500 text-white pb-8">
                <div className="absolute inset-0 text-white opacity-10">
                  <AfricanPattern variant="geometric" opacity={0.4} />
                </div>
                <CardTitle className="text-2xl text-center relative z-10 drop-shadow-md">
                  Question de Sécurité
                </CardTitle>
                <CardDescription className="text-center text-xl text-blue-50 relative z-10 mt-2 font-medium">
                  {messages.challenge}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-8 pb-8 relative">
                <form onSubmit={handleChallengeSubmit} className="space-y-6">
                  <div className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 text-blue-400 opacity-5">
                      <AfricanPattern variant="wax" opacity={0.5} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 text-center relative z-10 leading-relaxed">
                      {challenge.questionFr}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="answer" className="text-lg font-semibold text-gray-800">
                      Ta réponse
                    </Label>
                    <Input
                      id="answer"
                      type="text"
                      placeholder="Entre ta réponse ici..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="text-xl h-16 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/30 rounded-2xl bg-blue-50/50 font-semibold"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
                    disabled={answerMutation.isPending}
                  >
                    {answerMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        Vérification...
                      </span>
                    ) : (
                      'Valider'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-16 text-xl font-semibold rounded-2xl border-2 hover:bg-gray-50"
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
            <Card className="shadow-2xl backdrop-blur-xl bg-gradient-to-br from-green-50 to-emerald-100 border-4 border-green-400 overflow-hidden">
              <div className="absolute inset-0 text-green-600 opacity-10">
                <AfricanPattern variant="geometric" opacity={0.4} />
              </div>
              <CardContent className="pt-12 pb-12 text-center relative">
                <div className="text-9xl mb-6 animate-bounce">✅</div>
                <h2 className="text-4xl font-bold text-green-900 mb-4 drop-shadow-sm">
                  {messages.success}
                </h2>
                <p className="text-2xl text-green-700 font-semibold">Redirection en cours...</p>
              </CardContent>
            </Card>
          )}

          {step === 'agent_required' && (
            <Card className="shadow-2xl backdrop-blur-xl bg-gradient-to-br from-orange-50 to-red-100 border-4 border-orange-400 overflow-hidden">
              <div className="absolute inset-0 text-orange-600 opacity-10">
                <AfricanPattern variant="wax" opacity={0.4} />
              </div>
              <CardContent className="pt-12 pb-12 text-center relative">
                <div className="text-9xl mb-6 animate-pulse">📞</div>
                <h2 className="text-4xl font-bold text-orange-900 mb-4 drop-shadow-sm">
                  {messages.error}
                </h2>
                <p className="text-2xl text-orange-700 font-semibold mb-8">
                  Un agent va te contacter très bientôt.
                </p>
                <Button
                  variant="outline"
                  className="text-xl h-16 px-10 font-bold rounded-2xl border-2 border-orange-400 hover:bg-orange-50"
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
            <div className="inline-flex items-center gap-3 px-8 py-4 backdrop-blur-xl bg-white/90 rounded-full shadow-2xl border-2 border-amber-200/50">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-base font-bold text-gray-800">
                Authentification Sociale Sécurisée
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
