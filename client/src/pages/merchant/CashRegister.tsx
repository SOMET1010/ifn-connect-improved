import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ShoppingCart, Mic, Check, X, ArrowLeft, Wallet, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { audioManager } from '@/lib/audioManager';
import { toast } from 'sonner';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { parseVoiceCommand } from '@/utils/voiceCommandParser';
import MobileNavigation from '@/components/accessibility/MobileNavigation';
import MobileMoneyPayment from '@/components/payments/MobileMoneyPayment';
import { SavingsProposalModal } from '@/components/SavingsProposalModal';

/**
 * Interface de caisse tactile pour les marchands
 * Avec pavé numérique large et enregistrement vocal
 */
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

  // Mock merchantId - À remplacer par l'ID réel de l'utilisateur connecté
  const merchantId = 1;

  // Charger les paramètres du marchand
  const { data: settings } = trpc.merchantSettings.get.useQuery({ merchantId });

  // Charger les produits du marchand
  const { data: products = [], isLoading: loadingProducts } = trpc.products.listByMerchant.useQuery({
    merchantId,
  });

  // Charger les statistiques du jour
  const { data: todayStats } = trpc.sales.todayStats.useQuery({
    merchantId,
  });

  // Mutation pour créer une vente
  const createSale = trpc.sales.create.useMutation({
    onSuccess: (data, variables) => {
      toast.success('Vente enregistrée !');
      audioManager.speak('Vente enregistrée avec succès');
      
      // Vérifier si la proposition d'épargne est activée et si le montant dépasse le seuil
      const saleAmount = variables.quantity * variables.unitPrice;
      if (settings?.savingsProposalEnabled && 
          saleAmount >= parseFloat(settings.savingsProposalThreshold || '20000')) {
        const percentage = parseFloat(settings.savingsProposalPercentage || '2') / 100;
        const suggestedAmount = Math.floor(saleAmount * percentage);
        setSavingsProposalData({
          saleAmount,
          suggestedAmount,
        });
        
        // Attendre 2 secondes avant d'afficher la proposition
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

  // Gérer le clic sur une touche du pavé numérique
  const handleNumberClick = (num: string) => {
    audioManager.provideFeedback('tap');
    setQuantity(prev => prev + num);
  };

  // Effacer la saisie
  const handleClear = () => {
    audioManager.provideFeedback('tap');
    setQuantity('');
  };

  // Effacer le dernier chiffre
  const handleBackspace = () => {
    audioManager.provideFeedback('tap');
    setQuantity(prev => prev.slice(0, -1));
  };

  // Ouvrir le dialogue de sélection du mode de paiement
  const handleSave = () => {
    if (!selectedProduct || !quantity) {
      toast.error('Sélectionnez un produit et entrez une quantité');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseFloat(quantity);
    const unitPrice = parseFloat(product.basePrice || '0');
    const totalAmount = qty * unitPrice;

    // Stocker les données de la vente en attente
    setPendingSaleData({
      productId: product.id,
      quantity: qty,
      unitPrice,
    });

    // Ouvrir le dialogue de sélection du mode de paiement
    setShowPaymentDialog(true);
  };

  // Enregistrer la vente avec paiement cash
  const handleCashPayment = () => {
    if (!pendingSaleData) return;

    createSale.mutate({
      ...pendingSaleData,
      paymentMethod: 'cash',
    });

    setShowPaymentDialog(false);
    setPendingSaleData(null);
  };

  // Ouvrir le dialogue Mobile Money
  const handleMobileMoneyPayment = () => {
    setShowPaymentDialog(false);
    setShowMobileMoneyDialog(true);
  };

  // Succès du paiement Mobile Money
  const handleMobileMoneySuccess = (transactionId: string) => {
    if (!pendingSaleData) return;

    createSale.mutate({
      ...pendingSaleData,
      paymentMethod: 'mobile_money',
      transactionId,
    });

    setShowMobileMoneyDialog(false);
    setPendingSaleData(null);
  };

  // Erreur du paiement Mobile Money
  const handleMobileMoneyError = (error: string) => {
    console.error('Erreur paiement Mobile Money:', error);
    // Le dialogue reste ouvert pour permettre de réessayer
  };

  // Hook de reconnaissance vocale
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
      if (isFinal) {
        handleVoiceCommandComplete(text);
      }
    },
    onError: (error) => {
      toast.error(error);
      setShowVoiceCard(false);
    },
  });

  // Traiter la commande vocale complète
  const handleVoiceCommandComplete = (text: string) => {
    const parsed = parseVoiceCommand(text);
    
    if (parsed.confidence === 'low') {
      toast.error('Commande non comprise. Veuillez réessayer.');
      audioManager.speak('Commande non comprise');
      return;
    }

    // Trouver le produit correspondant
    if (parsed.productName) {
      const product = products.find(p => p.name === parsed.productName);
      if (product) {
        setSelectedProduct(product.id);
        audioManager.speak(`Produit sélectionné: ${product.name}`);
      }
    }

    // Remplir la quantité
    if (parsed.quantity) {
      setQuantity(String(parsed.quantity));
    }

    // Feedback vocal
    if (parsed.confidence === 'high') {
      audioManager.speak('Commande bien comprise');
      toast.success('Commande comprise ! Vérifiez et validez.');
    } else {
      toast.info('Commande partiellement comprise. Vérifiez les informations.');
    }

    setShowVoiceCard(false);
  };

  // Démarrer l'enregistrement vocal
  const handleVoiceRecord = () => {
    if (!isSupported) {
      toast.error('Reconnaissance vocale non supportée par votre navigateur');
      return;
    }

    setShowVoiceCard(true);
    setVoiceTranscript('');
    resetTranscript();
    audioManager.speak('Dites votre commande');
    startListening();
  };

  // Arrêter l'enregistrement
  const handleStopVoice = () => {
    stopListening();
    setShowVoiceCard(false);
  };

  // Effet pour afficher la transcription en temps réel
  useEffect(() => {
    if (transcript) {
      setVoiceTranscript(transcript);
    }
  }, [transcript]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
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
            <h1 className="text-2xl font-bold">💰 Caisse</h1>
            <p className="text-sm opacity-90">Enregistrer une vente</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceRecord}
            className={`text-primary-foreground hover:bg-primary-foreground/20 ${voiceState === 'listening' ? 'animate-pulse bg-red-500' : ''}`}
          >
            <Mic size={24} />
          </Button>
        </div>
      </div>

      {/* Carte de reconnaissance vocale */}
      {showVoiceCard && (
        <div className="container mt-4">
          <Alert className="border-orange-500 bg-orange-50">
            <Mic className="h-5 w-5 text-orange-600 animate-pulse" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-orange-900">
                  {voiceState === 'listening' ? '🎤 Écoute en cours...' : '🔍 Traitement...'}
                </p>
                {voiceTranscript && (
                  <p className="text-sm text-gray-700 italic">
                    "{voiceTranscript}"
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopVoice}
                  className="mt-2"
                >
                  Arrêter
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Statistiques du jour */}
      {todayStats && (
        <div className="container mt-4 grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Ventes aujourd'hui</p>
            <p className="text-3xl font-bold text-primary">{todayStats.salesCount}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total du jour</p>
            <p className="text-3xl font-bold text-accent">{todayStats.totalAmount.toLocaleString()} FCFA</p>
          </Card>
        </div>
      )}

      {/* Sélection du produit */}
      <div className="container mt-6">
        <h2 className="text-lg font-bold mb-3">Sélectionnez un produit</h2>
        {loadingProducts ? (
          <p className="text-center text-muted-foreground">Chargement...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((product) => (
              <Button
                key={product.id}
                variant={selectedProduct === product.id ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => {
                  audioManager.provideFeedback('tap');
                  setSelectedProduct(product.id);
                }}
              >
                <ShoppingCart size={32} />
                <div className="text-center">
                  <p className="font-bold">{product.name}</p>
                  <p className="text-xs opacity-80">{product.basePrice} FCFA/{product.unit}</p>
                  <p className="text-xs text-muted-foreground">Stock: {product.stockQuantity || 0}</p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Affichage de la quantité */}
      <div className="container mt-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Quantité</p>
          <p className="text-5xl font-bold text-center min-h-[60px] flex items-center justify-center">
            {quantity || '0'}
          </p>
        </Card>
      </div>

      {/* Pavé numérique */}
      <div className="container mt-6">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'].map((key) => (
            <Button
              key={key}
              variant="outline"
              className="h-20 text-3xl font-bold"
              onClick={() => {
                if (key === '←') {
                  handleBackspace();
                } else {
                  handleNumberClick(key);
                }
              }}
            >
              {key}
            </Button>
          ))}
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            variant="outline"
            size="lg"
            className="h-16 text-lg"
            onClick={handleClear}
          >
            <X className="mr-2" size={24} />
            Effacer
          </Button>
          <Button
            variant="default"
            size="lg"
            className="h-16 text-lg bg-accent hover:bg-accent/90"
            onClick={handleSave}
            disabled={!selectedProduct || !quantity || createSale.isPending}
          >
            <Check className="mr-2" size={24} />
            Valider
          </Button>
        </div>
      </div>

      {/* Dialogue de sélection du mode de paiement */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mode de paiement</DialogTitle>
            <DialogDescription>
              Montant : <span className="font-bold text-lg">{pendingSaleData ? (pendingSaleData.quantity * pendingSaleData.unitPrice).toLocaleString() : 0} FCFA</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-primary"
              onClick={handleCashPayment}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Banknote className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-semibold text-center">Espèces</p>
                <p className="text-xs text-muted-foreground text-center">Paiement cash</p>
              </div>
            </Card>
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-primary"
              onClick={handleMobileMoneyPayment}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-orange-600" />
                </div>
                <p className="font-semibold text-center">Mobile Money</p>
                <p className="text-xs text-muted-foreground text-center">Orange, MTN, Moov, Wave</p>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue de paiement Mobile Money */}
      <MobileMoneyPayment
        open={showMobileMoneyDialog}
        onClose={() => {
          setShowMobileMoneyDialog(false);
          setPendingSaleData(null);
        }}
        amount={pendingSaleData ? (pendingSaleData.quantity * pendingSaleData.unitPrice) : 0}
        onSuccess={handleMobileMoneySuccess}
        onError={handleMobileMoneyError}
      />

      {/* Modal de proposition d'épargne */}
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

      {/* Navigation mobile */}
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
