import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  orderId?: number;
  onSuccess?: () => void;
}

type PaymentProvider = "orange_money" | "mtn_momo" | "wave" | "moov_money";

const providers: Array<{ value: PaymentProvider; label: string; color: string }> = [
  { value: "orange_money", label: "Orange Money", color: "bg-orange-500" },
  { value: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-500" },
  { value: "wave", label: "Wave", color: "bg-blue-500" },
  { value: "moov_money", label: "Moov Money", color: "bg-green-600" },
];

export function PaymentModal({ open, onClose, amount, orderId, onSuccess }: PaymentModalProps) {
  const { t } = useLanguage();
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "initiating" | "pending" | "success" | "failed">("idle");

  const initiatePayment = trpc.payments.initiatePayment.useMutation({
    onSuccess: (data) => {
      setTransactionId(data.transactionId);
      setPaymentStatus("pending");
      toast.success("Paiement initié ! Veuillez confirmer sur votre téléphone.");
    },
    onError: (error) => {
      setPaymentStatus("failed");
      toast.error(`Erreur : ${error.message}`);
    },
  });

  // Polling manuel avec useQuery
  const checkStatusQuery = trpc.payments.checkPaymentStatus.useQuery(
    { transactionId: transactionId! },
    {
      enabled: transactionId !== null && paymentStatus === "pending",
      refetchInterval: 3000, // Poll toutes les 3 secondes
    }
  );

  // Gérer les changements de statut
  useEffect(() => {
    if (checkStatusQuery.data) {
      const status = checkStatusQuery.data.status;
      if (status === "completed" || status === "success") {
        setPaymentStatus("success");
        toast.success("✅ Paiement réussi !");
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 2000);
      } else if (status === "failed") {
        setPaymentStatus("failed");
        toast.error("❌ Paiement échoué");
      }
    }
  }, [checkStatusQuery.data]);

  // Timeout après 2 minutes
  useEffect(() => {
    if (paymentStatus === "pending" && transactionId) {
      const timeout = setTimeout(() => {
        setPaymentStatus("failed");
        toast.error("Délai d'attente dépassé");
      }, 120000); // 2 minutes

      return () => clearTimeout(timeout);
    }
  }, [paymentStatus, transactionId]);

  const handleInitiatePayment = () => {
    if (!selectedProvider) {
      toast.error("Veuillez sélectionner un moyen de paiement");
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return;
    }

    setPaymentStatus("initiating");
    initiatePayment.mutate({
      provider: selectedProvider,
      phoneNumber,
      orderId: orderId!,
    });
  };

  const handleClose = () => {
    setSelectedProvider(null);
    setPhoneNumber("");
    setTransactionId(null);
    setPaymentStatus("idle");
    onClose();
  };

  // Formater le montant en FCFA
  const formattedAmount = new Intl.NumberFormat("fr-FR").format(amount);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold text-center">
            💰 Payer {formattedAmount} FCFA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Étape 1 : Sélection du provider */}
          {paymentStatus === "idle" && (
            <>
              <div>
                <h3 className="text-2xl font-bold mb-4">1. Choisissez votre moyen de paiement</h3>
                <div className="grid grid-cols-2 gap-4">
                  {providers.map((provider) => (
                    <button
                      key={provider.value}
                      onClick={() => setSelectedProvider(provider.value)}
                      className={`
                        p-6 rounded-xl border-4 transition-all
                        ${selectedProvider === provider.value
                          ? `${provider.color} text-white border-white scale-105`
                          : "bg-white border-gray-300 hover:border-gray-400"
                        }
                      `}
                    >
                      <div className="text-3xl font-bold">{provider.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Étape 2 : Saisie du numéro */}
              {selectedProvider && (
                <div>
                  <h3 className="text-2xl font-bold mb-4">2. Entrez votre numéro de téléphone</h3>
                  <div className="flex items-center gap-4">
                    <Smartphone className="w-12 h-12 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="07 XX XX XX XX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-3xl h-20 px-6"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 ml-16">
                    Format : 10 chiffres (ex: 0707123456)
                  </p>
                </div>
              )}

              {/* Bouton de validation */}
              {selectedProvider && phoneNumber.length >= 10 && (
                <div className="flex gap-4">
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    size="lg"
                    className="flex-1 h-20 text-2xl"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleInitiatePayment}
                    size="lg"
                    className="flex-1 h-20 text-2xl bg-green-600 hover:bg-green-700"
                  >
                    Payer {formattedAmount} FCFA
                  </Button>
                </div>
              )}
            </>
          )}

          {/* État : Initiation du paiement */}
          {paymentStatus === "initiating" && (
            <div className="text-center py-12">
              <Loader2 className="w-24 h-24 animate-spin text-blue-500 mx-auto mb-6" />
              <p className="text-3xl font-bold">Initialisation du paiement...</p>
            </div>
          )}

          {/* État : En attente de confirmation */}
          {paymentStatus === "pending" && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                <Smartphone className="w-16 h-16 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold mb-4">En attente de confirmation</p>
              <p className="text-xl text-gray-600">
                Veuillez composer le code sur votre téléphone pour confirmer le paiement
              </p>
              <p className="text-lg text-gray-500 mt-4">
                Transaction ID : {transactionId}
              </p>
            </div>
          )}

          {/* État : Succès */}
          {paymentStatus === "success" && (
            <div className="text-center py-12">
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
              <p className="text-4xl font-bold text-green-600 mb-4">✅ Paiement réussi !</p>
              <p className="text-2xl text-gray-600">
                {formattedAmount} FCFA
              </p>
            </div>
          )}

          {/* État : Échec */}
          {paymentStatus === "failed" && (
            <div className="text-center py-12">
              <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
              <p className="text-4xl font-bold text-red-600 mb-4">❌ Paiement échoué</p>
              <p className="text-xl text-gray-600 mb-6">
                Le paiement n'a pas pu être effectué
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="lg"
                  className="h-16 text-xl px-8"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setPaymentStatus("idle");
                    setTransactionId(null);
                  }}
                  size="lg"
                  className="h-16 text-xl px-8 bg-blue-600 hover:bg-blue-700"
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
