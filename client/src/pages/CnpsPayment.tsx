import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, CreditCard, Smartphone, Building2, Banknote, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CnpsPayment() {
  const [, setLocation] = useLocation();

  const [amount, setAmount] = useState('10000');
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'bank_transfer' | 'cash' | 'card'>('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string; reference?: string } | null>(null);

  const { data: cnpsStatus, isLoading: statusLoading } = trpc.cnps.getStatus.useQuery();
  const payMutation = trpc.cnps.payContribution.useMutation({
    onSuccess: (data) => {
      setPaymentResult(data);
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === 'mobile_money' && !phoneNumber) {
      toast.error('Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (paymentMethod === 'mobile_money' && !otp) {
      toast.error('Veuillez entrer le code OTP généré depuis votre app Mobile Money');
      return;
    }

    payMutation.mutate({
      amount: parseInt(amount),
      paymentMethod,
      phoneNumber: paymentMethod === 'mobile_money' ? phoneNumber : undefined,
      otp: paymentMethod === 'mobile_money' ? otp : undefined,
    });
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation('/protection-sociale')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Payer ma cotisation CNPS</CardTitle>
          <CardDescription>
            Prolongez votre couverture sociale de 1 mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cnpsStatus && (
            <Alert className="mb-6">
              <AlertDescription>
                {cnpsStatus.hasActiveCnps ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>
                      Votre CNPS est active jusqu'au{' '}
                      {cnpsStatus.cnpsExpiryDate
                        ? new Date(cnpsStatus.cnpsExpiryDate).toLocaleDateString('fr-FR')
                        : 'N/A'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Votre CNPS a expiré. Renouvelez-la dès maintenant.</span>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {paymentResult ? (
            <div className="space-y-4">
              <Alert className={paymentResult.success ? 'border-green-600' : 'border-red-600'}>
                <AlertDescription className="flex items-center gap-2">
                  {paymentResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold">{paymentResult.message}</p>
                    {paymentResult.reference && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Référence : {paymentResult.reference}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  onClick={() => setLocation('/protection-sociale')}
                  variant="outline"
                  className="flex-1"
                >
                  Retour au tableau de bord
                </Button>
                <Button
                  onClick={() => setPaymentResult(null)}
                  className="flex-1"
                >
                  Nouveau paiement
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (FCFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="5000"
                  max="15000"
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Montant recommandé : 10 000 FCFA/mois
                </p>
              </div>

              <div className="space-y-3">
                <Label>Méthode de paiement</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <Label htmlFor="mobile_money" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Smartphone className="w-5 h-5 text-orange-600" />
                      <span>Mobile Money (Orange, MTN, Moov, Wave)</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span>Virement bancaire</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Banknote className="w-5 h-5 text-green-600" />
                      <span>Espèces</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      <span>Carte bancaire</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMethod === 'mobile_money' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+225 XX XX XX XX XX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">Code OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Entrez le code OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                    />
                    <p className="text-sm text-muted-foreground">
                      Générez un code OTP depuis votre application Mobile Money (Orange Money, MTN, Moov, Wave) avant de continuer.
                    </p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={payMutation.isPending}
              >
                {payMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Paiement en cours...
                  </>
                ) : (
                  <>
                    Payer {parseInt(amount).toLocaleString('fr-FR')} FCFA
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
