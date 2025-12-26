/**
 * Page de connexion marchand ultra-simplifiée
 * Téléphone + PIN uniquement, sans email ni OAuth
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { PhoneInput } from '@/components/PhoneInput';
import { PinPad } from '@/components/PinPad';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

export function MerchantLogin() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'phone' | 'pin'>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.multiLevelAuth.loginWithPhone.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);

      // Annonce vocale de succès
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Connexion réussie');
        utterance.lang = 'fr-FR';
        window.speechSynthesis.speak(utterance);
      }

      // Vibration de succès
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }

      // Stocker la session
      if (data.sessionId) {
        localStorage.setItem('merchant_session', data.sessionId);
        localStorage.setItem('merchant_id', data.merchantId?.toString() || '');
        localStorage.setItem('user_id', data.userId.toString());
        localStorage.setItem('user_name', data.userName || '');
      }

      // Rediriger selon le cas
      if (data.requiresPINChange) {
        setLocation('/merchant/change-pin');
      } else {
        setLocation('/merchant/dashboard');
      }
    },
    onError: (error) => {
      setIsLoading(false);
      setError(error.message);
      setPin(''); // Réinitialiser le PIN

      // Annonce vocale d'erreur
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Erreur de connexion');
        utterance.lang = 'fr-FR';
        window.speechSynthesis.speak(utterance);
      }

      // Vibration d'erreur
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    },
  });

  const handlePhoneComplete = (completedPhone: string) => {
    setPhone(completedPhone);
    setError('');
    setStep('pin');

    // Annonce vocale
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Maintenant, saisissez votre code PIN');
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePinComplete = (completedPin: string) => {
    setPin(completedPin);
    setError('');
    setIsLoading(true);

    // Soumettre la connexion
    loginMutation.mutate({
      phone,
      pinCode: completedPin,
      deviceInfo: navigator.userAgent,
      ipAddress: undefined, // Sera récupéré côté serveur
    });
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setPin('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 shadow-2xl border-4 border-orange-200">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            IFN Connect
          </h1>
          <p className="text-xl text-gray-600">
            Connexion Marchand
          </p>
        </div>

        {/* Indicateur d'étape */}
        <div className="flex justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            step === 'phone' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            <span className="text-2xl">📱</span>
            <span className="font-semibold">Téléphone</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            step === 'pin' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            <span className="text-2xl">🔢</span>
            <span className="font-semibold">Code PIN</span>
          </div>
        </div>

        {/* Message d'erreur global */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-xl animate-shake">
            <p className="text-lg text-red-700 font-semibold text-center flex items-center justify-center gap-2">
              <span className="text-3xl">❌</span>
              {error}
            </p>
          </div>
        )}

        {/* Étape 1 : Téléphone */}
        {step === 'phone' && (
          <div className="space-y-6">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              onComplete={handlePhoneComplete}
              disabled={isLoading}
              error={error}
            />

            <Button
              onClick={() => handlePhoneComplete(phone)}
              disabled={phone.replace(/\D/g, '').length !== 10 || isLoading}
              size="lg"
              className="w-full h-16 text-2xl font-bold rounded-2xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  Continuer
                  <span className="ml-2">→</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Étape 2 : PIN */}
        {step === 'pin' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-xl font-semibold text-gray-700 flex items-center justify-center gap-2">
                <span className="text-3xl">🔢</span>
                Saisissez votre code PIN
              </p>
              <p className="text-lg text-gray-500 mt-2">
                Téléphone : <strong>{phone}</strong>
              </p>
            </div>

            <PinPad
              value={pin}
              onChange={setPin}
              onComplete={handlePinComplete}
              disabled={isLoading}
              masked={true}
            />

            <Button
              onClick={handleBackToPhone}
              disabled={isLoading}
              size="lg"
              variant="outline"
              className="w-full h-14 text-xl font-semibold rounded-2xl"
            >
              <span className="mr-2">←</span>
              Changer de numéro
            </Button>
          </div>
        )}

        {/* Loader global */}
        {isLoading && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-3 text-xl text-gray-600">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Connexion en cours...</span>
            </div>
          </div>
        )}

        {/* Aide */}
        <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-center text-lg text-blue-900 flex items-center justify-center gap-2">
            <span className="text-2xl">ℹ️</span>
            <span>
              Première fois ? Demandez à un <strong>agent terrain</strong> de vous enrôler
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
