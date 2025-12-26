import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  AlertTriangle,
  Search,
  Package
} from 'lucide-react';
import { toast as showToast } from 'sonner';
import { PaymentModal } from '@/components/PaymentModal';

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  category: string;
  unit: string;
}

export default function VirtualMarket() {
  const { merchant } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [pendingOrderAmount, setPendingOrderAmount] = useState<number>(0);

  // Récupérer les produits disponibles
  const { data: products, isLoading } = trpc.orders.availableProducts.useQuery();
  
  // Récupérer le stock du marchand pour afficher les alertes
  const { data: merchantStock } = trpc.stock.listByMerchant.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  // Mutation pour créer une commande
  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      // Ne pas vider le panier tout de suite, attendre le paiement
      showToast.success("Commande créée ! Procédez au paiement.");
    },
    onError: (error) => {
      showToast.error(`Erreur: ${error.message}`);
    },
  });

  // Filtrer les produits selon la recherche
  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Ajouter au panier
  const addToCart = (product: { id: number; name: string; basePrice: string | null; category: string | null; unit: string }) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: parseFloat(product.basePrice || '0'),
        category: product.category || '',
        unit: product.unit,
      }]);
    }
  };

  // Retirer du panier
  const removeFromCart = (productId: number) => {
    const existing = cart.find(item => item.productId === productId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.productId !== productId));
    }
  };

  // Calculer le total
  const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Valider la commande et ouvrir le modal de paiement
  const handleCheckout = async () => {
    if (!merchant) return;
    if (cart.length === 0) return;

    try {
      // Créer une seule commande avec le premier produit (pour simplifier)
      // TODO: Gérer plusieurs produits dans une seule commande
      const firstItem = cart[0];
      const result = await createOrderMutation.mutateAsync({
        merchantId: merchant.id,
        productId: firstItem.productId,
        quantity: firstItem.quantity,
        unitPrice: firstItem.unitPrice,
        totalAmount: cartTotal,
      });

      // Ouvrir le modal de paiement
      setPendingOrderId(result.id);
      setPendingOrderAmount(cartTotal);
      setPaymentModalOpen(true);
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
    }
  };

  // Callback après paiement réussi
  const handlePaymentSuccess = () => {
    showToast.success("✅ Paiement réussi ! Votre commande est confirmée.");
    setCart([]);
    setPendingOrderId(null);
    setPendingOrderAmount(0);
  };

  // Vérifier si un produit est en stock bas
  const isLowStock = (productId: number) => {
    const stock = merchantStock?.find(s => s.productId === productId);
    return stock && parseFloat(stock.quantity) < 10;
  };

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accès Refusé</CardTitle>
            <CardDescription>Vous devez être enregistré comme marchand.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 shadow-sm">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🛒 Marché Virtuel</h1>
              <p className="text-gray-600 mt-1">Commandez vos produits en ligne</p>
            </div>
            {cart.length > 0 && (
              <Badge variant="default" className="text-lg px-4 py-2">
                {cart.length} produit{cart.length > 1 ? 's' : ''} • {cartTotal.toLocaleString('fr-FR')} FCFA
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des produits */}
          <div className="lg:col-span-2 space-y-6">
            {/* Barre de recherche */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Produits */}
            {isLoading ? (
              <div className="text-center py-12">Chargement des produits...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                    {/* Image du produit */}
                    {product.imageUrl && (
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isLowStock(product.id) && (
                          <Badge variant="destructive" className="absolute top-2 right-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Stock bas
                          </Badge>
                        )}
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription>{product.category}</CardDescription>
                        </div>
                        {!product.imageUrl && isLowStock(product.id) && (
                          <Badge variant="destructive" className="ml-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Stock bas
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {parseFloat(product.basePrice || '0').toLocaleString('fr-FR')} FCFA
                          </div>
                          <div className="text-sm text-gray-500">par {product.unit}</div>
                        </div>
                        <Button
                          onClick={() => addToCart(product)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && !isLoading && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  Aucun produit trouvé
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panier */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Votre Panier
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    Votre panier est vide
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between border-b pb-3">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">
                            {item.unitPrice.toLocaleString('fr-FR')} FCFA / {item.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeFromCart(item.productId)}
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => addToCart({ id: item.productId, name: item.productName, basePrice: item.unitPrice.toString(), category: item.category || '', unit: item.unit })}
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-lg font-bold mb-4">
                        <span>Total</span>
                        <span className="text-orange-600">{cartTotal.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <Button
                        onClick={handleCheckout}
                        disabled={createOrderMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg"
                      >
                        {createOrderMutation.isPending ? 'Commande en cours...' : '💰 Payer avec Mobile Money'}
                      </Button>
                    </div>

                    <Alert>
                      <AlertDescription className="text-xs">
                        💡 Votre commande sera traitée sous 24-48h
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de paiement */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        amount={pendingOrderAmount}
        orderId={pendingOrderId || undefined}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
