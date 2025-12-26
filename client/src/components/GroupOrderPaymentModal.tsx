import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, CreditCard, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface GroupOrderPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantId: number;
  groupedOrderId: number;
  amount: number;
  productName: string;
}

export function GroupOrderPaymentModal({
  open,
  onOpenChange,
  participantId,
  groupedOrderId,
  amount,
  productName,
}: GroupOrderPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');

  const utils = trpc.useUtils();

  const recordPaymentMutation = trpc.groupedOrders.recordPayment.useMutation({
    onSuccess: () => {
      toast.success('✅ Paiement enregistré avec succès !');
      utils.groupedOrders.getPaymentStatus.invalidate({ groupedOrderId });
      utils.groupedOrders.getByCooperative.invalidate();
      onOpenChange(false);
      setTransactionId('');
    },
    onError: (error) => {
      toast.error(`❌ Erreur : ${error.message}`);
    },
  });

  const handleSubmit = () => {
    recordPaymentMutation.mutate({
      participantId,
      groupedOrderId,
      amount,
      paymentMethod,
      transactionId: transactionId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Payer ma participation
          </DialogTitle>
          <DialogDescription>
            Confirmer le paiement pour {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Montant */}
          <div className="space-y-2">
            <Label>Montant à payer</Label>
            <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {amount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Montant calculé selon le palier de prix actif
            </p>
          </div>

          {/* Méthode de paiement */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Méthode de paiement</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                <SelectItem value="check">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ID de transaction (optionnel) */}
          {paymentMethod !== 'cash' && (
            <div className="space-y-2">
              <Label htmlFor="transactionId">
                Numéro de transaction (optionnel)
              </Label>
              <Input
                id="transactionId"
                placeholder="Ex: MM123456789"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Pour faciliter le suivi et la comptabilité
              </p>
            </div>
          )}

          {/* Note informative */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Note :</strong> Ce paiement confirme votre participation à la commande groupée. 
              Le créateur pourra confirmer la commande une fois que tous les participants auront payé.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={recordPaymentMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleSubmit}
            disabled={recordPaymentMutation.isPending}
          >
            {recordPaymentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Traitement...
              </>
            ) : (
              'Confirmer le paiement'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
