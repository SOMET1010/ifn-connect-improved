import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Smartphone, Wallet } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Composant de paiement Mobile Money
 * Supporte Orange Money, MTN Mobile Money, Moov Money, Wave
 */

interface MobileMoneyPaymentProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  orderId?: number;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
}

type Provider = 'orange_money' | 'mtn_momo' | 'moov_money' | 'wave';

const PROVIDERS: { id: Provider; name: string; color: string; logo: string }[] = [
  { id: 'orange_money', name: 'Orange Money', color: 'bg-orange-500', logo: '🍊' },
  { id: 'mtn_momo', name: 'MTN Mobile Money', color: 'bg-yellow-500', logo: '📱' },
  { id: 'moov_money', name: 'Moov Money', color: 'bg-blue-500', logo: '💙' },
  { id: 'wave', name: 'Wave', color: 'bg-pink-500', logo: '🌊' },
];

export default function MobileMoneyPayment({
  open,
  onClose,
  amount,
  orderId,
  onSuccess,
  onError,
}: MobileMoneyPaymentProps) {
  const [step, setStep] = useState<'select_provider' | 'enter_phone' | 'processing' | 'success' | 'error'>('select_provider');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mutation pour initier le paiement
  const initiatePayment = trpc.payments.initiatePayment.useMutation({
    onSuccess: (data) => {
      setTransactionReference(data.reference);
      setStep('processing');
      
      // Vérifier le statut après 2 secondes (mode simulation)
      setTimeout(() => {
        checkStatus.mutate({ transactionId: data.transactionId });
      }, 2500);
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setStep('error');
      onError?.(error.message);
      toast.error('Échec du paiement');
    },
  });

  // Query pour vérifier le statut
  const checkStatus = trpc.payments.checkPaymentStatus.useMutation({
    onSuccess: (data) => {
      if (data.status === 'success') {
        setStep('success');
        onSuccess?.(data.transactionId.toString());
        toast.success('Paiement réussi !');
      } else if (data.status === 'failed') {
        setErrorMessage('Le paiement a échoué. Veuillez réessayer.');
        setStep('error');
        onError?.('Paiement échoué');
        toast.error('Paiement échoué');
      } else {
        // Toujours en attente, revérifier dans 2 secondes
        setTimeout(() => {
          checkStatus.mutate({ transactionId: data.transactionId });
        }, 2000);
      }
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setStep('error');
      onError?.(error.message);
    },
  });

  // Réinitialiser l'état quand le dialogue s'ouvre
  useEffect(() => {
    if (open) {
      setStep('select_provider');
      setSelectedProvider(null);
      setPhoneNumber('');
      setTransactionReference('');
      setErrorMessage('');
    }
  }, [open]);

  // Gérer la sélection du provider
  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setStep('enter_phone');
  };

  // Gérer la soumission du formulaire
  const handleSubmit = () => {
    if (!selectedProvider || !phoneNumber) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    // Valider le format du numéro de téléphone
    const phoneRegex = /^(225)?(0[1-9]|[4-9][0-9])\d{6}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error('Numéro de téléphone invalide');
      return;
    }

    // Initier le paiement
    initiatePayment.mutate({
      orderId,
      provider: selectedProvider,
      phoneNumber: phoneNumber.startsWith('225') ? phoneNumber : `225${phoneNumber}`,
    });
  };

  // Gérer le retour en arrière
  const handleBack = () => {
    if (step === 'enter_phone') {
      setStep('select_provider');
      setSelectedProvider(null);
    }
  };

  // Gérer la fermeture
  const handleClose = () => {
    if (step !== 'processing') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Paiement Mobile Money
          </DialogTitle>
          <DialogDescription>
            Montant à payer : <span className="font-bold text-lg text-primary">{amount.toLocaleString()} FCFA</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Étape 1 : Sélection du provider */}
          {step === 'select_provider' && (
            <div className="space-y-3">
              <Label>Choisissez votre moyen de paiement</Label>
              <div className="grid grid-cols-2 gap-3">
                {PROVIDERS.map((provider) => (
                  <Card
                    key={provider.id}
                    className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
                      selectedProvider === provider.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleProviderSelect(provider.id)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full ${provider.color} flex items-center justify-center text-2xl`}>
                        {provider.logo}
                      </div>
                      <p className="text-sm font-semibold text-center">{provider.name}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Étape 2 : Saisie du numéro de téléphone */}
          {step === 'enter_phone' && selectedProvider && (
            <div className="space-y-4">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Provider sélectionné : <span className="font-bold">{PROVIDERS.find(p => p.id === selectedProvider)?.name}</span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ex: 0707070700"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Format : 10 chiffres (avec ou sans indicatif 225)
                </p>
                <p className="text-xs text-orange-600">
                  💡 <strong>Mode simulation :</strong> Numéro terminant par 00 = succès, 99 = échec
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Retour
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={initiatePayment.isPending}>
                  {initiatePayment.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Payer'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Étape 3 : Traitement en cours */}
          {step === 'processing' && (
            <div className="space-y-4 text-center py-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <div>
                <p className="font-semibold text-lg">Traitement en cours...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Veuillez confirmer le paiement sur votre téléphone
                </p>
                {transactionReference && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Référence : {transactionReference}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Étape 4 : Succès */}
          {step === 'success' && (
            <div className="space-y-4 text-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <p className="font-semibold text-lg text-green-600">Paiement réussi !</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Le paiement de {amount.toLocaleString()} FCFA a été effectué avec succès
                </p>
                {transactionReference && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Référence : {transactionReference}
                  </p>
                )}
              </div>
              <Button onClick={onClose} className="w-full">
                Fermer
              </Button>
            </div>
          )}

          {/* Étape 5 : Erreur */}
          {step === 'error' && (
            <div className="space-y-4 text-center py-6">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <p className="font-semibold text-lg text-red-600">Paiement échoué</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {errorMessage || 'Une erreur est survenue lors du paiement'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setStep('select_provider');
                    setSelectedProvider(null);
                    setPhoneNumber('');
                    setErrorMessage('');
                  }}
                  className="flex-1"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
