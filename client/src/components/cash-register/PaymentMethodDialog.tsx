import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Banknote, Wallet } from 'lucide-react';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCashPayment: () => void;
  onMobileMoneyPayment: () => void;
  totalAmount: number;
}

export default function PaymentMethodDialog({
  open,
  onOpenChange,
  onCashPayment,
  onMobileMoneyPayment,
  totalAmount,
}: PaymentMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mode de paiement</DialogTitle>
          <DialogDescription>
            Montant total : {totalAmount.toLocaleString('fr-FR')} FCFA
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Card
            onClick={onCashPayment}
            className="p-6 cursor-pointer hover:bg-green-50 hover:border-green-500 transition-all"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Banknote className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-center font-semibold">Espèces</p>
            </div>
          </Card>

          <Card
            onClick={onMobileMoneyPayment}
            className="p-6 cursor-pointer hover:bg-orange-50 hover:border-orange-500 transition-all"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-center font-semibold">Mobile Money</p>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
