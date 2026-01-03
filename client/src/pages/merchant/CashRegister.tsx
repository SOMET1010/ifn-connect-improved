import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Mic, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { audioManager } from '@/lib/audioManager';
import { toast } from 'sonner';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { parseVoiceCommand } from '@/utils/voiceCommandParser';
import MobileNavigation from '@/components/accessibility/MobileNavigation';
import MobileMoneyPayment from '@/components/payments/MobileMoneyPayment';
import { SavingsProposalModal } from '@/components/SavingsProposalModal';
import ProductGrid from '@/components/cash-register/ProductGrid';
import NumericKeypad from '@/components/cash-register/NumericKeypad';
import SalesSummary from '@/components/cash-register/SalesSummary';
import PaymentMethodDialog from '@/components/cash-register/PaymentMethodDialog';
import VoiceInputCard from '@/components/cash-register/VoiceInputCard';

export default function CashRegister() {
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showVoiceCard, setShowVoiceCard] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showMobileMoneyDialog, setShowMobileMoneyDialog] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState<any>(null);
  const [showSavingsProposal, setShowSavingsProposal] = useState(false);
  const [savingsProposalData, setSavingsProposalData] = useState<{ saleAmount: number; suggestedAmount: number } | null>(null);

  const merchantId = 1;

  const { data: settings } = trpc.merchantSettings.get.useQuery({ merchantId });
  const { data: products = [], isLoading: loadingProducts } = trpc.products.listByMerchant.useQuery({ merchantId });
  const { data: todayStats } = trpc.sales.todayStats.useQuery({ merchantId });

  const createSale = trpc.sales.create.useMutation({
    onSuccess: (_data, variables) => {
      toast.success('Vente enregistrée !');
      audioManager.speak('Vente enregistrée avec succès');

      const saleAmount = variables.quantity * variables.unitPrice;
      if (
        settings?.savingsProposalEnabled &&
        saleAmount >= parseFloat(settings.savingsProposalThreshold || '20000')
      ) {
        const percentage = parseFloat(settings.savingsProposalPercentage || '2') / 100;
        const suggestedAmount = Math.floor(saleAmount * percentage);
        setSavingsProposalData({ saleAmount, suggestedAmount });

        setTimeout(() => {
          setShowSavingsProposal(true);
          audioManager.speak(`Grosse vente ! Veux-tu mettre ${suggestedAmount} francs dans ta cagnotte ?`);
        }, 2000);
      }

      setQuantity('');
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    },
  });

  const handleNumberClick = (num: string) => setQuantity((prev) => prev + num);
  const handleClear = () => setQuantity('');
  const handleBackspace = () => setQuantity((prev) => prev.slice(0, -1));

  const handleSave = () => {
    if (!selectedProduct || !quantity) {
      toast.error('Sélectionnez un produit et entrez une quantité');
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const qty = parseFloat(quantity);
    const unitPrice = parseFloat(product.basePrice || '0');

    setPendingSaleData({ productId: product.id, quantity: qty, unitPrice });
    setShowPaymentDialog(true);
  };

  const handleCashPayment = () => {
    if (!pendingSaleData) return;
    createSale.mutate({ ...pendingSaleData, paymentMethod: 'cash' });
    setShowPaymentDialog(false);
    setPendingSaleData(null);
  };

  const handleMobileMoneyPayment = () => {
    setShowPaymentDialog(false);
    setShowMobileMoneyDialog(true);
  };

  const handleMobileMoneySuccess = (transactionId: string) => {
    if (!pendingSaleData) return;
    createSale.mutate({ ...pendingSaleData, paymentMethod: 'mobile_money', transactionId });
    setShowMobileMoneyDialog(false);
    setPendingSaleData(null);
  };

  const {
    isSupported,
    state: voiceState,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    language: 'fr-FR',
    onResult: (text, isFinal) => {
      setVoiceTranscript(text);
      if (isFinal) handleVoiceCommandComplete(text);
    },
    onError: (error) => {
      toast.error(error);
      setShowVoiceCard(false);
    },
  });

  const handleVoiceCommandComplete = (text: string) => {
    const parsed = parseVoiceCommand(text);

    if (parsed.confidence === 'low') {
      toast.error('Commande non comprise');
      audioManager.speak('Commande non comprise');
      return;
    }

    if (parsed.productName) {
      const product = products.find((p) => p.name === parsed.productName);
      if (product) {
        setSelectedProduct(product.id);
        audioManager.speak(`Produit sélectionné: ${product.name}`);
      }
    }

    if (parsed.quantity) setQuantity(String(parsed.quantity));

    if (parsed.confidence === 'high') {
      audioManager.speak('Commande bien comprise');
      toast.success('Commande comprise ! Vérifiez et validez.');
    }

    setShowVoiceCard(false);
  };

  const handleVoiceRecord = () => {
    if (!isSupported) {
      toast.error('Reconnaissance vocale non supportée');
      return;
    }
    setShowVoiceCard(true);
    setVoiceTranscript('');
    resetTranscript();
    audioManager.speak('Dites votre commande');
    startListening();
  };

  const handleStopVoice = () => {
    stopListening();
    setShowVoiceCard(false);
  };

  useEffect(() => {
    if (transcript) setVoiceTranscript(transcript);
  }, [transcript]);

  const totalAmount = pendingSaleData
    ? pendingSaleData.quantity * pendingSaleData.unitPrice
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="container flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/merchant/dashboard')}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={24} />
          </Button>

          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold">Caisse</h1>
            <p className="text-sm opacity-90">Enregistrer une vente</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceRecord}
            className={`text-primary-foreground hover:bg-primary-foreground/20 ${
              voiceState === 'listening' ? 'animate-pulse bg-red-500' : ''
            }`}
          >
            <Mic size={24} />
          </Button>
        </div>
      </div>

      <div className="container mt-4">
        <SalesSummary
          todaySales={todayStats?.salesCount}
          todayRevenue={todayStats?.totalAmount}
        />
      </div>

      <div className="container mt-6">
        <h2 className="text-lg font-bold mb-3">Sélectionnez un produit</h2>
        <ProductGrid
          products={products}
          selectedProductId={selectedProduct}
          onSelectProduct={setSelectedProduct}
          isLoading={loadingProducts}
        />
      </div>

      <div className="container mt-6">
        <NumericKeypad
          onNumberClick={handleNumberClick}
          onClear={handleClear}
          onBackspace={handleBackspace}
          displayValue={quantity}
        />

        <div className="mt-4">
          <Button
            variant="default"
            size="lg"
            className="w-full h-16 text-lg bg-accent hover:bg-accent/90"
            onClick={handleSave}
            disabled={!selectedProduct || !quantity || createSale.isPending}
          >
            <Check className="mr-2" size={24} />
            Valider la vente
          </Button>
        </div>
      </div>

      <VoiceInputCard
        show={showVoiceCard}
        transcript={voiceTranscript}
        isListening={voiceState === 'listening'}
        onStop={handleStopVoice}
      />

      <PaymentMethodDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onCashPayment={handleCashPayment}
        onMobileMoneyPayment={handleMobileMoneyPayment}
        totalAmount={totalAmount}
      />

      <MobileMoneyPayment
        open={showMobileMoneyDialog}
        onClose={() => {
          setShowMobileMoneyDialog(false);
          setPendingSaleData(null);
        }}
        amount={totalAmount}
        onSuccess={handleMobileMoneySuccess}
        onError={(error) => console.error('Erreur paiement Mobile Money:', error)}
      />

      {savingsProposalData && (
        <SavingsProposalModal
          isOpen={showSavingsProposal}
          onClose={() => {
            setShowSavingsProposal(false);
            setSavingsProposalData(null);
          }}
          saleAmount={savingsProposalData.saleAmount}
          suggestedAmount={savingsProposalData.suggestedAmount}
          merchantId={merchantId}
          onConfirm={() => {
            audioManager.speak('C\'est fait ! Ta cagnotte avance bien !');
          }}
        />
      )}

      <MobileNavigation
        activeItem="sell"
        onItemClick={(itemId) => {
          if (itemId === 'sell') setLocation('/merchant/cash-register');
          if (itemId === 'stock') setLocation('/merchant/stock');
          if (itemId === 'money') setLocation('/merchant/money');
          if (itemId === 'help') setLocation('/merchant/help');
        }}
      />
    </div>
  );
}
