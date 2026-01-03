import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Lock, AlertCircle } from 'lucide-react';
import { generateFingerprint } from '@/lib/deviceFingerprint';
import { AfricanPattern } from '@/components/ui/african-pattern';

export default function SocialLoginSimple() {
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  useEffect(() => {
    const initDevice = async () => {
      const fingerprint = await generateFingerprint();
      setDeviceFingerprint(fingerprint);
    };
    initDevice();
  }, []);

  const loginMutation = trpc.socialAuth.loginWithPin.useMutation({
    onSuccess: (data) => {
      console.log('Login successful:', data);

      if (data.merchant) {
        navigate('/merchant-simple/dashboard');
      } else if (data.user.role === 'agent') {
        navigate('/agent-simple/dashboard');
      } else if (data.user.role === 'cooperative') {
        navigate('/cooperative/dashboard');
      } else if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    },
    onError: (err) => {
      setError(err.message);
      setIsLoading(false);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!phone || !pin) {
      setError('Remplis tous les champs');
      setIsLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError('Le numéro doit contenir 10 chiffres');
      setIsLoading(false);
      return;
    }

    if (!/^[0-9]{4}$/.test(pin)) {
      setError('Le code PIN doit contenir 4 chiffres');
      setIsLoading(false);
      return;
    }

    if (!deviceFingerprint) {
      setError('Erreur d\'initialisation. Recharge la page.');
      setIsLoading(false);
      return;
    }

    try {
      loginMutation.mutate({
        phone: `+225${phone}`,
        pinCode: pin,
        deviceFingerprint,
        deviceName: navigator.userAgent,
      });
    } catch (err) {
      setError('Une erreur est survenue');
      setIsLoading(false);
    }
  };

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
              Bienvenue sur PNAVIM
            </h1>
            <p className="text-2xl text-amber-100 font-semibold drop-shadow-md">Entre ton numéro et ton code</p>
          </div>

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
                Tape ton numéro et ton code PIN
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-8 pb-8 relative">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="phone" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-[#D35400]" />
                    Numéro de téléphone
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-4 bg-gradient-to-r from-[#D35400] to-[#E67E22] text-white rounded-xl text-lg font-bold shadow-md">
                      +225
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="0701020304"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      className="flex-1 text-xl h-14 border-2 border-amber-200 focus:border-[#D35400] focus:ring-2 focus:ring-[#E67E22]/30 rounded-xl bg-amber-50/50 font-semibold"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label htmlFor="pin" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#D35400]" />
                    Code PIN (4 chiffres)
                  </label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="text-center text-3xl tracking-[1em] h-14 border-2 border-amber-200 focus:border-[#D35400] focus:ring-2 focus:ring-[#E67E22]/30 rounded-xl bg-amber-50/50 font-bold"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="backdrop-blur-sm bg-red-900/80 border-red-700 animate-shake">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-white font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-[#D35400] via-[#E67E22] to-[#F39C12] hover:from-[#C0440F] hover:via-[#D35400] hover:to-[#E67E22] shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-amber-600/30"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>

                <div className="space-y-3 pt-4 border-t-2 border-amber-200/50">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-lg font-semibold text-[#D35400] hover:text-[#C0440F] hover:bg-amber-50 h-12 rounded-xl"
                    onClick={() => navigate('/pin-reset')}
                    disabled={isLoading}
                  >
                    J'ai oublié mon code PIN
                  </Button>

                  <div className="text-center pt-2">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border-2 border-amber-200/50 shadow-md">
                      <span className="text-sm font-semibold text-gray-700">
                        Pas encore inscrit ?{' '}
                        <span className="text-[#D35400] font-bold">
                          Contacte ton agent terrain
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-8 py-4 backdrop-blur-xl bg-white/90 rounded-full shadow-2xl border-2 border-amber-200/50">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-base font-bold text-gray-800">
                Authentification Sécurisée
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
