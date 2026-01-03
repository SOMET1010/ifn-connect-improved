import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Send, User, DollarSign, Lock, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function SendMoney() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'form' | 'confirm' | 'pin'>('form');
  const [formData, setFormData] = useState({
    recipientPhone: '',
    amount: '',
    description: '',
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const { data: wallet } = trpc.wallet.getBalance.useQuery();
  const { data: beneficiaries } = trpc.beneficiaries.list.useQuery();
  const transferMutation = trpc.wallet.transfer.useMutation({
    onSuccess: () => {
      toast.success('Transfert effectué avec succès!');
      setLocation('/merchant/wallet');
    },
    onError: (error) => {
      setError(error.message);
      toast.error('Échec du transfert: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.recipientPhone || !formData.amount) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Montant invalide');
      return;
    }

    if (wallet && amount > wallet.balance) {
      setError('Solde insuffisant');
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = () => {
    setStep('pin');
  };

  const handlePinSubmit = () => {
    if (!pin || pin.length < 4) {
      setError('Veuillez entrer un code PIN valide (minimum 4 chiffres)');
      return;
    }

    transferMutation.mutate({
      recipientPhone: formData.recipientPhone,
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
      pin,
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const selectBeneficiary = (phone: string, name: string) => {
    setFormData({
      ...formData,
      recipientPhone: phone,
      description: `Transfert vers ${name}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/merchant/wallet')}
        className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-100 text-gray-700 p-4 rounded-full shadow-lg transition-all"
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Envoyer de l'argent</h1>
          <p className="text-xl text-gray-600">Transférez facilement vers un autre utilisateur</p>
        </div>

        {wallet && (
          <Card className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="text-sm opacity-90 mb-1">Solde disponible</div>
              <div className="text-3xl font-bold">{formatAmount(wallet.balance)}</div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {beneficiaries && beneficiaries.length > 0 && step === 'form' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contacts fréquents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {beneficiaries.slice(0, 4).map((beneficiary) => (
                  <Button
                    key={beneficiary.id}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() =>
                      selectBeneficiary(
                        beneficiary.contactPhone || '',
                        beneficiary.nickname || beneficiary.contactName || ''
                      )
                    }
                  >
                    <User className="w-6 h-6" />
                    <span className="text-sm font-semibold">
                      {beneficiary.nickname || beneficiary.contactName}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Détails du transfert</CardTitle>
            <CardDescription>Remplissez les informations ci-dessous</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Numéro de téléphone du destinataire *</Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  placeholder="Ex: +225 0123456789"
                  value={formData.recipientPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientPhone: e.target.value })
                  }
                  required
                  className="text-lg h-14"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant (XOF) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Ex: 10000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="1"
                    step="1"
                    className="text-lg h-14 pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnelle)</Label>
                <Textarea
                  id="description"
                  placeholder="Ex: Remboursement, cadeau, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full h-14 text-lg" size="lg">
                <Send className="w-5 h-5 mr-2" />
                Continuer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Dialog open={step === 'confirm'} onOpenChange={() => setStep('form')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer le transfert</DialogTitle>
              <DialogDescription>Vérifiez les détails avant de continuer</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Destinataire:</span>
                <span className="font-semibold">{formData.recipientPhone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Montant:</span>
                <span className="font-bold text-2xl text-green-600">
                  {formatAmount(parseFloat(formData.amount))}
                </span>
              </div>
              {formData.description && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Description:</span>
                  <span className="text-right max-w-[200px]">{formData.description}</span>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('form')}>
                Annuler
              </Button>
              <Button onClick={handleConfirm}>Confirmer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={step === 'pin'} onOpenChange={() => setStep('confirm')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entrez votre code PIN</DialogTitle>
              <DialogDescription>
                Pour sécuriser cette transaction, veuillez entrer votre code PIN
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <Label htmlFor="pin">Code PIN</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  className="text-lg h-14 pl-12 text-center tracking-widest"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('confirm')}>
                Retour
              </Button>
              <Button onClick={handlePinSubmit} disabled={transferMutation.isPending}>
                {transferMutation.isPending ? 'Traitement...' : 'Valider'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
