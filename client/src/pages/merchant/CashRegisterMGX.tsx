import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ShoppingCart, Mic, Check, X, ArrowLeft, Wallet, Banknote, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { audioManager } from '@/lib/audioManager';
import { toast } from '@/lib/sensoryToast';
import { useLanguage } from '@/hooks/useLanguage';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { parseVoiceCommand } from '@/utils/voiceCommandParser';
import MobileMoneyPayment from '@/components/payments/MobileMoneyPayment';
import { SavingsProposalModal } from '@/components/SavingsProposalModal';
import { useSensoryFeedback } from '@/hooks/useSensoryFeedback';

/**
 * 🎨 CAISSE MGX - DESIGN KPATA OPTIMISÉ
 * 
 * Améliorations :
 * - Pills de filtrage par catégorie
 * - Sticky cart (panier toujours visible)
 * - Inputs XXL (h-12) pour tactile
 * - Design KPATA (rounded-3xl, ombres colorées)
 * - Micro-interactions (hover:scale-[1.02])
 */

// Catégories de produits
const CATEGORIES = [
  { id: 'all', label: 'Tout', emoji: '🛒', color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
  { id: 'légumes', label: 'Légumes', emoji: '🥬', color: 'bg-gradient-to-br from-green-500 to-green-600' },
  { id: 'fruits', label: 'Fruits', emoji: '🍎', color: 'bg-gradient-to-br from-red-500 to-red-600' },
  { id: 'céréales', label: 'Céréales', emoji: '🌾', color: 'bg-gradient-to-br from-amber-500 to-amber-600' },
  { id: 'viandes', label: 'Viandes', emoji: '🍖', color: 'bg-gradient-to-br from-rose-500 to-rose-600' },
  { id: 'poissons', label: 'Poissons', emoji: '🐟', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  { id: 'condiments', label: 'Condiments', emoji: '🧂', color: 'bg-gradient-to-br from-orange-500 to-orange-600' },
];

type CartItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
};

export default function CashRegisterMGX() {
  const [, setLocation] = useLocation();
  const { triggerSuccess, triggerError } = useSensoryFeedback();
  const { language, setLanguage } = useLanguage();
  
  // État du panier
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // État de la saisie
  const [quantity, setQuantity] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  
  // État vocal
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showVoiceCard, setShowVoiceCard] = useState(false);
  
  // État des dialogues
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
      triggerSuccess();
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
      
      // Vider le panier
      setCart([]);
      setQuantity('');
      setSelectedProduct(null);
    },
    onError: (error) => {
      triggerError();
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    },
  });

  // Filtrer les produits par catégorie et recherche
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category?.toLowerCase() === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.nameDioula?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculer le total du panier
  const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Ajouter un produit au panier
  const addToCart = (product: any) => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Entrez une quantité valide');
      return;
    }

    const qty = parseFloat(quantity);
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      // Mettre à jour la quantité
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + qty }
          : item
      ));
    } else {
      // Ajouter un nouvel article
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: parseFloat(product.basePrice || '0'),
        unit: product.unit,
      }]);
    }

    triggerSuccess();
    toast.success(`${product.name} ajouté au panier`);
    setQuantity('');
    setSelectedProduct(null);
  };

  // Retirer un produit du panier
  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
    triggerSuccess();
    toast.success('Produit retiré du panier');
  };

  // Vider le panier
  const clearCart = () => {
    setCart([]);
    triggerSuccess();
    toast.success('Panier vidé');
  };

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

  // Valider le panier et ouvrir le dialogue de paiement
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    // Pour l'instant, on enregistre une vente simple avec le premier produit
    // TODO: Implémenter la vente multiple
    const firstItem = cart[0];
    setPendingSaleData({
      productId: firstItem.productId,
      quantity: firstItem.quantity,
      unitPrice: firstItem.unitPrice,
    });

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 pb-48">
      {/* Header avec gradient MGX */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 text-white p-6 shadow-2xl shadow-emerald-900/30">
        <div className="container flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/merchant/dashboard')}
            className="text-white hover:bg-white/20 rounded-2xl"
          >
            <ArrowLeft size={28} />
          </Button>
          
          <div className="text-center flex-1">
            <h1 className="text-3xl font-black tracking-tight">💰 CAISSE KPATA</h1>
            <p className="text-sm opacity-90 font-medium">Vendre comme un pro</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle FR/Nouchi */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'fr' ? 'dioula' : 'fr')}
              className="text-white hover:bg-white/20 rounded-full px-3 py-1 text-xs font-bold border border-white/30"
            >
              {language === 'fr' ? '🇫🇷 FR' : '🇨🇮 Dioula'}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceRecord}
              className={`text-white hover:bg-white/20 rounded-2xl ${voiceState === 'listening' ? 'animate-pulse bg-red-500' : ''}`}
            >
              <Mic size={28} />
            </Button>
          </div>
        </div>
      </div>

      {/* Carte de reconnaissance vocale */}
      {showVoiceCard && (
        <div className="container mt-6">
          <Alert className="border-orange-500 bg-orange-50 rounded-3xl shadow-lg shadow-orange-900/20">
            <Mic className="h-6 w-6 text-orange-600 animate-pulse" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-bold text-orange-900 text-lg">
                  {voiceState === 'listening' ? '🎤 Écoute en cours...' : '🔍 Traitement...'}
                </p>
                {voiceTranscript && (
                  <p className="text-sm text-gray-700 italic font-medium">
                    "{voiceTranscript}"
                  </p>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStopVoice}
                  className="mt-3 rounded-2xl"
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
        <div className="container mt-6 grid grid-cols-2 gap-4">
          <Card className="p-6 text-center rounded-3xl shadow-lg shadow-emerald-900/20 bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 hover:scale-[1.02] transition-transform">
            <p className="text-sm text-muted-foreground font-semibold">Ventes aujourd'hui</p>
            <p className="text-4xl font-black text-emerald-600 mt-2">{todayStats.salesCount}</p>
          </Card>
          <Card className="p-6 text-center rounded-3xl shadow-lg shadow-amber-900/20 bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 hover:scale-[1.02] transition-transform">
            <p className="text-sm text-muted-foreground font-semibold">Total du jour</p>
            <p className="text-4xl font-black text-amber-600 mt-2">{todayStats.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground font-medium">FCFA</p>
          </Card>
        </div>
      )}

      {/* Barre de recherche XXL */}
      <div className="container mt-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 text-lg rounded-3xl shadow-lg border-2 border-emerald-200 focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Pills de filtrage par catégorie */}
      <div className="container mt-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                triggerSuccess();
              }}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap
                transition-all duration-200 shadow-lg
                ${selectedCategory === category.id
                  ? `${category.color} text-white scale-110 shadow-xl`
                  : 'bg-white text-gray-700 hover:scale-105 border-2 border-gray-200'
                }
              `}
            >
              <span className="text-xl">{category.emoji}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grille de produits avec design KPATA */}
      <div className="container mt-6">
        <h2 className="text-xl font-black mb-4 text-gray-800">Sélectionnez un produit</h2>
        {loadingProducts ? (
          <p className="text-center text-muted-foreground font-medium">Chargement...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`
                  p-6 cursor-pointer rounded-3xl shadow-lg transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98]
                  ${selectedProduct === product.id
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-900/30 border-4 border-emerald-700'
                    : 'bg-white hover:shadow-xl shadow-gray-900/10 border-2 border-gray-200'
                  }
                `}
                onClick={() => {
                  triggerSuccess();
                  setSelectedProduct(product.id);
                }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center
                    ${selectedProduct === product.id ? 'bg-white/20' : 'bg-emerald-100'}
                  `}>
                    <ShoppingCart size={32} className={selectedProduct === product.id ? 'text-white' : 'text-emerald-600'} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-lg">{product.name}</p>
                    <p className={`text-sm font-bold mt-1 ${selectedProduct === product.id ? 'text-white/90' : 'text-emerald-600'}`}>
                      {product.basePrice} FCFA/{product.unit}
                    </p>
                    <p className={`text-xs font-medium mt-1 ${selectedProduct === product.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                      Stock: {product.stockQuantity || 0}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Affichage de la quantité */}
      <div className="container mt-6">
        <Card className="p-8 rounded-3xl shadow-2xl shadow-indigo-900/20 bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-200">
          <p className="text-sm text-muted-foreground mb-3 font-semibold">Quantité</p>
          <p className="text-6xl font-black text-center min-h-[80px] flex items-center justify-center text-indigo-600">
            {quantity || '0'}
          </p>
        </Card>
      </div>

      {/* Pavé numérique XXL */}
      <div className="container mt-6">
        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'].map((key) => (
            <Button
              key={key}
              variant="outline"
              className="h-20 text-4xl font-black rounded-3xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50"
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
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button
            variant="outline"
            size="lg"
            className="h-16 text-lg font-bold rounded-3xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all border-2 border-gray-300"
            onClick={handleClear}
          >
            <X className="mr-2" size={24} />
            Effacer
          </Button>
          <Button
            variant="default"
            size="lg"
            className="h-16 text-lg font-bold rounded-3xl shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => {
              if (!selectedProduct || !quantity) {
                toast.error('Sélectionnez un produit et entrez une quantité');
                return;
              }
              const product = products.find(p => p.id === selectedProduct);
              if (product) {
                addToCart(product);
              }
            }}
            disabled={!selectedProduct || !quantity}
          >
            <Check className="mr-2" size={24} />
            Ajouter au panier
          </Button>
        </div>
      </div>

      {/* Sticky Cart (Panier fixe en bas) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-emerald-500 shadow-2xl shadow-emerald-900/30 z-50">
        <div className="container py-6">
          {/* Résumé du panier */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold">Panier</p>
                <p className="text-2xl font-black text-emerald-600">{cart.length} article{cart.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground font-semibold">Total</p>
              <p className="text-3xl font-black text-amber-600">{cartTotal.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-medium">FCFA</p>
            </div>
          </div>

          {/* Liste des articles du panier */}
          {cart.length > 0 && (
            <div className="max-h-32 overflow-y-auto mb-4 space-y-2 scrollbar-thin scrollbar-thumb-emerald-500">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} × {item.unitPrice} FCFA
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-emerald-600">{(item.quantity * item.unitPrice).toLocaleString()}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-red-100 hover:text-red-600"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Boutons d'action du panier */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-14 text-base font-bold rounded-3xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all border-2 border-gray-300"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 className="mr-2" size={20} />
              Vider
            </Button>
            <Button
              variant="default"
              size="lg"
              className="h-14 text-base font-bold rounded-3xl shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={handleCheckout}
              disabled={cart.length === 0 || createSale.isPending}
            >
              <Check className="mr-2" size={20} />
              Payer ({cartTotal.toLocaleString()} FCFA)
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogue de sélection du mode de paiement */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Mode de paiement</DialogTitle>
            <DialogDescription className="text-lg">
              Montant : <span className="font-black text-2xl text-emerald-600">{cartTotal.toLocaleString()} FCFA</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <Card
              className="p-6 cursor-pointer hover:shadow-2xl transition-all hover:border-emerald-500 rounded-3xl hover:scale-[1.02] active:scale-[0.98] border-2"
              onClick={handleCashPayment}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-900/30">
                  <Banknote className="h-10 w-10 text-white" />
                </div>
                <p className="font-black text-center text-lg">Espèces</p>
                <p className="text-xs text-muted-foreground text-center font-medium">Paiement cash</p>
              </div>
            </Card>
            <Card
              className="p-6 cursor-pointer hover:shadow-2xl transition-all hover:border-orange-500 rounded-3xl hover:scale-[1.02] active:scale-[0.98] border-2"
              onClick={handleMobileMoneyPayment}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/30">
                  <Wallet className="h-10 w-10 text-white" />
                </div>
                <p className="font-black text-center text-lg">Mobile Money</p>
                <p className="text-xs text-muted-foreground text-center font-medium">Orange, MTN, Moov, Wave</p>
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
        amount={cartTotal}
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
    </div>
  );
}
