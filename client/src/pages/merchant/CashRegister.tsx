import { useState } from 'react';
import { useLocation } from 'wouter';
import { ShoppingCart, Mic, Check, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { audioManager } from '@/lib/audioManager';
import { toast } from 'sonner';
import MobileNavigation from '@/components/accessibility/MobileNavigation';

/**
 * Interface de caisse tactile pour les marchands
 * Avec pavé numérique large et enregistrement vocal
 */
export default function CashRegister() {
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Mock merchantId - À remplacer par l'ID réel de l'utilisateur connecté
  const merchantId = 1;

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
    onSuccess: () => {
      toast.success('Vente enregistrée !');
      audioManager.speak('Vente enregistrée avec succès');
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

  // Enregistrer la vente
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

    createSale.mutate({
      merchantId,
      productId: selectedProduct,
      quantity: qty,
      unitPrice,
      totalAmount,
      paymentMethod: 'cash',
    });
  };

  // Démarrer l'enregistrement vocal
  const handleVoiceRecord = () => {
    setIsRecording(true);
    audioManager.speak('Dites votre commande');
    // TODO: Implémenter la reconnaissance vocale
    setTimeout(() => {
      setIsRecording(false);
      toast.info('Reconnaissance vocale en cours de développement');
    }, 2000);
  };

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
            className={`text-primary-foreground hover:bg-primary-foreground/20 ${isRecording ? 'animate-pulse bg-red-500' : ''}`}
          >
            <Mic size={24} />
          </Button>
        </div>
      </div>

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
            Enregistrer
          </Button>
        </div>
      </div>

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
