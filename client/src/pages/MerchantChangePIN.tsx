/**
 * Page de changement de PIN (obligatoire si PIN temporaire)
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { PinPad } from '@/components/PinPad';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

export function MerchantChangePIN() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'old' | 'new' | 'confirm'>('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const changePinMutation = trpc.multiLevelAuth.changePIN.useMutation({
    onSuccess: () => {
      setIsLoading(false);

      // Annonce vocale de succès
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Code PIN changé avec succès');
        utterance.lang = 'fr-FR';
        window.speechSynthesis.speak(utterance);
      }

      // Vibration de succès
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }

      // Rediriger vers le dashboard
      setTimeout(() => {
        setLocation('/merchant/dashboard');
      }, 1500);
    },
    onError: (error) => {
      setIsLoading(false);
      setError(error.message);

      // Réinitialiser selon l'étape
      if (step === 'old') {
        setOldPin('');
      } else if (step === 'new') {
        setNewPin('');
      } else {
        setConfirmPin('');
      }

      // Annonce vocale d'erreur
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Erreur');
        utterance.lang = 'fr-FR';
        window.speechSynthesis.speak(utterance);
      }

      // Vibration d'erreur
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    },
  });

  const handleOldPinComplete = (pin: string) => {
    setOldPin(pin);
    setError('');
    setStep('new');

    // Annonce vocale
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Maintenant, choisissez votre nouveau code PIN');
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNewPinComplete = (pin: string) => {
    // Vérifier que le nouveau PIN est différent de l'ancien
    if (pin === oldPin) {
      setError('Le nouveau code PIN doit être différent de l\'ancien');
      setNewPin('');
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Le nouveau code doit être différent');
        utterance.lang = 'fr-FR';
        window.speechSynthesis.speak(utterance);
      }
      
      return;
    }

    setNewPin(pin);
    setError('');
    setStep('confirm');

    // Annonce vocale
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Confirmez votre nouveau code PIN');
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleConfirmPinComplete = (pin: string) => {
    // Vérifier que les deux PIN correspondent
    if (pin !== newPin) {
      setError('Les codes PIN ne correspondent pas');
      setConfirmPin('');
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Les codes ne correspondent pas');
        utterance.lang = 'fr-FR';
        window.speechSynthesis.speak(utterance);
      }
      
      return;
    }

    setConfirmPin(pin);
    setError('');
    setIsLoading(true);

    // Soumettre le changement
    changePinMutation.mutate({
      oldPinCode: oldPin,
      newPinCode: newPin,
      confirmPinCode: pin,
    });
  };

  const handleBack = () => {
    setError('');
    
    if (step === 'new') {
      setStep('old');
      setNewPin('');
    } else if (step === 'confirm') {
      setStep('new');
      setConfirmPin('');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'old':
        return 'Saisissez votre code PIN actuel';
      case 'new':
        return 'Choisissez votre nouveau code PIN';
      case 'confirm':
        return 'Confirmez votre nouveau code PIN';
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 'old':
        return '🔓';
      case 'new':
        return '🆕';
      case 'confirm':
        return '✅';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 shadow-2xl border-4 border-blue-200">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{getStepIcon()}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Changement de code PIN
          </h1>
          <p className="text-xl text-gray-600">
            {getStepTitle()}
          </p>
        </div>

        {/* Indicateur d'étape */}
        <div className="flex justify-center gap-2 mb-8">
          {['old', 'new', 'confirm'].map((s, index) => (
            <div
              key={s}
              className={`w-16 h-2 rounded-full transition-all ${
                s === step
                  ? 'bg-primary scale-110'
                  : index < ['old', 'new', 'confirm'].indexOf(step)
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-xl animate-shake">
            <p className="text-lg text-red-700 font-semibold text-center flex items-center justify-center gap-2">
              <span className="text-3xl">❌</span>
              {error}
            </p>
          </div>
        )}

        {/* PinPad selon l'étape */}
        <div className="space-y-6">
          {step === 'old' && (
            <PinPad
              value={oldPin}
              onChange={setOldPin}
              onComplete={handleOldPinComplete}
              disabled={isLoading}
              masked={true}
            />
          )}

          {step === 'new' && (
            <>
              <PinPad
                value={newPin}
                onChange={setNewPin}
                onComplete={handleNewPinComplete}
                disabled={isLoading}
                masked={false} // Afficher les chiffres pour mémorisation
              />
              
              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                <p className="text-center text-lg text-yellow-900 flex items-center justify-center gap-2">
                  <span className="text-2xl">💡</span>
                  <span>
                    Choisissez un code <strong>facile à retenir</strong> mais <strong>difficile à deviner</strong>
                  </span>
                </p>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <PinPad
                value={confirmPin}
                onChange={setConfirmPin}
                onComplete={handleConfirmPinComplete}
                disabled={isLoading}
                masked={true}
              />
              
              <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-xl">
                <p className="text-center text-lg text-blue-900 flex items-center justify-center gap-2">
                  <span className="text-2xl">🔒</span>
                  <span>
                    Saisissez à nouveau votre nouveau code pour confirmer
                  </span>
                </p>
              </div>
            </>
          )}

          {/* Bouton retour */}
          {step !== 'old' && !isLoading && (
            <Button
              onClick={handleBack}
              size="lg"
              variant="outline"
              className="w-full h-14 text-xl font-semibold rounded-2xl"
            >
              <span className="mr-2">←</span>
              Retour
            </Button>
          )}
        </div>

        {/* Loader */}
        {isLoading && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-3 text-xl text-gray-600">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Changement en cours...</span>
            </div>
          </div>
        )}

        {/* Conseils de sécurité */}
        <div className="mt-8 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
          <p className="text-center text-lg text-green-900 font-semibold mb-2">
            🛡️ Conseils de sécurité
          </p>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✓ Ne partagez jamais votre code PIN</li>
            <li>✓ Changez votre code régulièrement</li>
            <li>✓ N'utilisez pas votre date de naissance</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
