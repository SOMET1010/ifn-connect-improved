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

const providers: Array<{ 
  value: PaymentProvider; 
  label: string; 
  color: string;
  bgColor: string;
  image: string;
}> = [
  { 
    value: "orange_money", 
    label: "Orange Money", 
    color: "border-orange-500",
    bgColor: "bg-orange-50",
    image: "/orange-money-cartoon.png"
  },
  { 
    value: "mtn_momo", 
    label: "MTN MoMo", 
    color: "border-yellow-500",
    bgColor: "bg-yellow-50",
    image: "/mtn-momo-cartoon.png"
  },
  { 
    value: "wave", 
    label: "Wave", 
    color: "border-blue-500",
    bgColor: "bg-blue-50",
    image: "/wave-cartoon.png"
  },
  { 
    value: "moov_money", 
    label: "Moov Money", 
    color: "border-red-500",
    bgColor: "bg-red-50",
    image: "/moov-cartoon.png"
  },
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold text-center bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
            💰 Payer {formattedAmount} FCFA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Étape 1 : Sélection du provider */}
          {paymentStatus === "idle" && (
            <>
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">
                  🎯 Choisissez votre moyen de paiement
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {providers.map((provider) => (
                    <button aria-label="Sélectionner ce moyen de paiement"
                      key={provider.value}
                      onClick={() => setSelectedProvider(provider.value)}
                      className={`
                        relative p-6 rounded-2xl border-4 transition-all duration-300
                        ${selectedProvider === provider.value
                          ? `${provider.color} ${provider.bgColor} scale-105 shadow-2xl`
                          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg"
                        }
                      `}
                    >
                      {/* Illustration cartoon */}
                      <div className="flex flex-col items-center gap-3">
                        <img 
                          src={provider.image} 
                          alt={provider.label}
                          className={`w-32 h-32 object-contain transition-transform duration-300 ${
                            selectedProvider === provider.value ? 'scale-110' : 'scale-100'
                          }`}
                        />
                        <div className="text-2xl font-bold text-gray-800">
                          {provider.label}
                        </div>
                      </div>
                      
                      {/* Checkmark si sélectionné */}
                      {selectedProvider === provider.value && (
                        <div className="absolute top-3 right-3 bg-green-500 rounded-full p-2">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Étape 2 : Saisie du numéro */}
              {selectedProvider && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-2xl font-bold mb-6 text-center">
                    📱 Entrez votre numéro de téléphone
                  </h3>
                  <div className="bg-gradient-to-r from-orange-50 to-green-50 p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-4 rounded-xl shadow-md">
                        <Smartphone className="w-12 h-12 text-orange-500" />
                      </div>
                      <Input
                        type="tel"
                        placeholder="07 XX XX XX XX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="text-3xl h-20 px-6 border-4 border-gray-300 focus:border-orange-500 rounded-xl"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3 ml-20 font-medium">
                      💡 Format : 10 chiffres (ex: 0707123456)
                    </p>
                  </div>
                </div>
              )}

              {/* Bouton de validation */}
              {selectedProvider && phoneNumber.length >= 10 && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    size="lg"
                    className="flex-1 h-20 text-2xl border-4 hover:bg-gray-100 rounded-xl"
                  >
                    ❌ Annuler
                  </Button>
                  <Button
                    onClick={handleInitiatePayment}
                    size="lg"
                    className="flex-1 h-20 text-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl rounded-xl font-bold"
                  >
                    ✅ Payer {formattedAmount} FCFA
                  </Button>
                </div>
              )}
            </>
          )}

          {/* État : Initiation du paiement */}
          {paymentStatus === "initiating" && (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <Loader2 className="w-32 h-32 animate-spin text-blue-500 mx-auto mb-6" />
              <p className="text-3xl font-bold text-gray-800">⚡ Initialisation du paiement...</p>
              <p className="text-xl text-gray-600 mt-4">Veuillez patienter quelques instants</p>
            </div>
          )}

          {/* État : En attente de confirmation */}
          {paymentStatus === "pending" && (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <div className="relative inline-block mb-8">
                <img 
                  src="/payment-pending-cartoon.png" 
                  alt="En attente"
                  className="w-48 h-48 object-contain animate-pulse"
                />
              </div>
              <p className="text-4xl font-bold mb-4 text-blue-600">⏳ En attente de confirmation</p>
              <div className="bg-blue-50 p-6 rounded-2xl max-w-md mx-auto">
                <p className="text-xl text-gray-700 mb-3">
                  📲 Composez le code sur votre téléphone pour confirmer
                </p>
                <p className="text-lg text-gray-600 font-mono bg-white px-4 py-2 rounded-lg inline-block">
                  Transaction : #{transactionId}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {/* État : Succès */}
          {paymentStatus === "success" && (
            <div className="text-center py-12 animate-in zoom-in duration-500">
              <div className="relative inline-block mb-8">
                <img 
                  src="/payment-success-cartoon.png" 
                  alt="Succès"
                  className="w-64 h-64 object-contain animate-bounce"
                />
              </div>
              <p className="text-5xl font-bold text-green-600 mb-4">
                🎉 Paiement réussi !
              </p>
              <div className="bg-green-50 p-6 rounded-2xl max-w-md mx-auto">
                <p className="text-3xl font-bold text-gray-800">
                  {formattedAmount} FCFA
                </p>
                <p className="text-xl text-gray-600 mt-2">
                  ✅ Transaction confirmée
                </p>
              </div>
            </div>
          )}

          {/* État : Échec */}
          {paymentStatus === "failed" && (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <XCircle className="w-32 h-32 text-red-500 mx-auto mb-6 animate-pulse" />
              <p className="text-4xl font-bold text-red-600 mb-4">❌ Paiement échoué</p>
              <div className="bg-red-50 p-6 rounded-2xl max-w-md mx-auto mb-8">
                <p className="text-xl text-gray-700">
                  Le paiement n'a pas pu être effectué
                </p>
                <p className="text-lg text-gray-600 mt-2">
                  Veuillez vérifier votre solde et réessayer
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="lg"
                  className="h-16 text-xl px-8 border-4 rounded-xl"
                >
                  ❌ Annuler
                </Button>
                <Button
                  onClick={() => {
                    setPaymentStatus("idle");
                    setTransactionId(null);
                  }}
                  size="lg"
                  className="h-16 text-xl px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-xl rounded-xl font-bold"
                >
                  🔄 Réessayer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
