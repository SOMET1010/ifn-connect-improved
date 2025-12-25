import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Check, X, ArrowLeft, ShoppingCart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import OfflineIndicator from '@/components/OfflineIndicator';
import SpeechToggle from '@/components/SpeechToggle';
import LanguageSelector from '@/components/LanguageSelector';
import { useOffline } from '@/hooks/useOffline';
import { useSpeech } from '@/hooks/useSpeech';
import { useLanguage } from '@/hooks/useLanguage';
import { SavingsSuggestionDialog } from '@/components/SavingsSuggestionDialog';
import { VoiceSaleInput } from '@/components/VoiceSaleInput';

/**
 * Caisse ULTRA-SIMPLIFIÉE pour utilisateurs non habitués à l'informatique
 * Pavé numérique GÉANT + Liste de produits avec images
 */
export default function CashRegisterSimple() {
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSavingsSuggestion, setShowSavingsSuggestion] = useState(false);
  const [lastSaleAmount, setLastSaleAmount] = useState(0);
  const { isOnline, saveSaleOffline, updatePendingSalesCount } = useOffline();
  const { speakSaleSuccess, speakError, speakAlert, isEnabled: speechEnabled } = useSpeech();

  // Mock merchantId - À remplacer par l'ID réel
  const merchantId = 1;

  // Charger les produits
  const { data: products = [] } = trpc.products.listByMerchant.useQuery({ merchantId });

  // Charger les stats du jour
  const { data: todayStats } = trpc.sales.todayStats.useQuery({ merchantId });

  // Référence au montant total pour l'annonce vocale
  const lastSaleAmountRef = useRef<number>(0);

  // Mutation pour créer une vente
  const createSale = trpc.sales.create.useMutation({
    onSuccess: () => {
      const saleAmount = lastSaleAmountRef.current;
      
      // Afficher l'écran de succès GÉANT
      setShowSuccess(true);
      
      // Annonce vocale du succès avec le montant sauvegardé
      speakSaleSuccess(saleAmount);
      
      setTimeout(() => {
        setShowSuccess(false);
        setQuantity('');
        setSelectedProduct(null);
        
        // Proposer l'épargne si vente > 20 000 FCFA
        if (saleAmount >= 20000) {
          setLastSaleAmount(saleAmount);
          setShowSavingsSuggestion(true);
        }
      }, 3000);
      // Mettre à jour le compteur de ventes en attente
      updatePendingSalesCount();
    },
    onError: () => {
      toast.error('❌ Erreur ! Réessayez');
      speakError('Réessayez');
    },
  });

  // Gérer le clic sur une touche
  const handleNumberClick = (num: string) => {
    setQuantity(prev => prev + num);
  };

  // Effacer
  const handleClear = () => {
    setQuantity('');
  };

  // Valider la vente
  const handleValidate = async () => {
    if (!selectedProduct || !quantity) {
      toast.error('⚠️ Choisissez un produit et entrez une quantité !', {
        duration: 3000,
        style: { fontSize: '24px', padding: '24px' }
      });
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseFloat(quantity);
    const unitPrice = parseFloat(product.basePrice || '0');
    const totalAmount = qty * unitPrice;

    const saleData = {
      merchantId,
      productId: selectedProduct,
      quantity: qty,
      unitPrice,
      totalAmount,
      paymentMethod: 'cash' as const,
    };

    // Si hors ligne, sauvegarder localement
    if (!isOnline) {
      await saveSaleOffline({
        merchantId,
        items: [{
          productId: selectedProduct,
          quantity: qty,
          unitPrice,
        }],
        totalAmount,
        createdAt: new Date().toISOString(),
      });
      
      // Afficher l'écran de succès
      setShowSuccess(true);
      
      // Annonce vocale du succès (mode hors ligne)
      speakSaleSuccess(totalAmount);
      speakAlert('Mode hors ligne. La vente sera synchronisée automatiquement');
      
      toast.success('💾 Vente sauvegardée localement ! Elle sera synchronisée automatiquement.', {
        duration: 5000,
        style: { fontSize: '20px', padding: '20px' }
      });
      
      setTimeout(() => {
        setShowSuccess(false);
        setQuantity('');
        setSelectedProduct(null);
      }, 3000);
      
      return;
    }

    // Si en ligne, envoyer normalement
    lastSaleAmountRef.current = totalAmount;
    createSale.mutate(saleData);
  };

  // Écran de succès PLEIN ÉCRAN
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center z-50 animate-in fade-in duration-300">
        <div className="text-center text-white">
          <div className="mb-12">
            <Check className="w-64 h-64 mx-auto animate-bounce" strokeWidth={3} />
          </div>
          <h1 className="text-9xl font-bold mb-8">✅ VENDU !</h1>
          <p className="text-5xl">Vente enregistrée avec succès</p>
        </div>
      </div>
    );
  }

  const selectedProd = products.find(p => p.id === selectedProduct);
  const total = selectedProd ? parseFloat(quantity || '0') * parseFloat(selectedProd.basePrice || '0') : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      {/* Header */}
      <InstitutionalHeader />
      
      {/* Indicateur de connexion */}
      <OfflineIndicator />

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        
        {/* Boutons de navigation */}
        <div className="mb-8 flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setLocation('/merchant/dashboard')}
            className="bg-gray-200 hover:bg-gray-300 rounded-2xl px-8 py-6 flex items-center gap-4 text-3xl font-bold text-gray-700 transition-all hover:scale-105"
          >
            <ArrowLeft className="w-12 h-12" />
            Retour
          </button>
          
          {/* Bouton activation/désactivation du son */}
          <div id="btn-speech-toggle">
            <SpeechToggle />
          </div>
          
          {/* Sélecteur de langue */}
          <div id="btn-language-selector">
            <LanguageSelector />
          </div>
        </div>

        {/* Statistiques du jour */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl mb-2">Ventes aujourd'hui</p>
              <p className="text-6xl font-bold">{todayStats?.totalAmount.toLocaleString() || 0} FCFA</p>
            </div>
            <ShoppingCart className="w-32 h-32 opacity-50" />
          </div>
        </div>

        {/* Enregistrement vocal */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl">
          <h2 className="text-4xl font-bold mb-6 text-center text-gray-900">🎤 Enregistrement vocal</h2>
          <VoiceSaleInput
            products={products}
            onVoiceCommand={(productId, qty) => {
              setSelectedProduct(productId);
              setQuantity(qty.toString());
            }}
            language="fr"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LISTE DES PRODUITS - Gauche */}
          <div>
            <h2 className="text-5xl font-bold mb-8 text-gray-900">Choisir le produit</h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  className={`w-full rounded-3xl p-8 text-left transition-all transform hover:scale-105 ${
                    selectedProduct === product.id
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-2xl scale-105'
                      : 'bg-white hover:bg-gray-50 text-gray-900 shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    {/* Icône produit */}
                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl ${
                      selectedProduct === product.id ? 'bg-white/20' : 'bg-orange-100'
                    }`}>
                      🥕
                    </div>
                    
                    {/* Infos produit */}
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold mb-2">{product.name}</h3>
                      <p className="text-4xl font-bold">
                        {parseFloat(product.basePrice || '0').toLocaleString()} FCFA
                      </p>
                    </div>

                    {/* Checkmark si sélectionné */}
                    {selectedProduct === product.id && (
                      <Check className="w-16 h-16" strokeWidth={3} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PAVÉ NUMÉRIQUE - Droite */}
          <div>
            <h2 className="text-5xl font-bold mb-8 text-gray-900">Quantité</h2>
            
            {/* Affichage de la quantité */}
            <div className="bg-white rounded-3xl p-12 mb-8 shadow-2xl">
              <p className="text-3xl text-gray-600 mb-4">Quantité :</p>
              <p className="text-8xl font-bold text-gray-900 mb-8 min-h-[120px] flex items-center">
                {quantity || '0'}
              </p>
              
              {selectedProd && (
                <>
                  <div className="border-t-4 border-gray-200 pt-6 mb-6">
                    <p className="text-3xl text-gray-600">Prix unitaire :</p>
                    <p className="text-5xl font-bold text-gray-900">
                      {parseFloat(selectedProd.basePrice || '0').toLocaleString()} FCFA
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                    <p className="text-3xl mb-2">TOTAL :</p>
                    <p className="text-7xl font-bold">{total.toLocaleString()} FCFA</p>
                  </div>
                </>
              )}
            </div>

            {/* Pavé numérique GÉANT */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === '⌫') {
                      setQuantity(prev => prev.slice(0, -1));
                    } else {
                      handleNumberClick(key);
                    }
                  }}
                  className="bg-white hover:bg-gray-100 rounded-3xl p-12 text-6xl font-bold text-gray-900 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Boutons d'action GÉANTS */}
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={handleClear}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-3xl p-12 text-5xl font-bold shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4"
              >
                <X className="w-16 h-16" strokeWidth={3} />
                EFFACER
              </button>
              
              <button
                onClick={handleValidate}
                disabled={!selectedProduct || !quantity || createSale.isPending}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-3xl p-12 text-5xl font-bold shadow-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
              >
                <Check className="w-16 h-16" strokeWidth={3} />
                VALIDER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de proposition d'épargne */}
      <SavingsSuggestionDialog
        isOpen={showSavingsSuggestion}
        onClose={() => setShowSavingsSuggestion(false)}
        saleAmount={lastSaleAmount}
      />
    </div>
  );
}
