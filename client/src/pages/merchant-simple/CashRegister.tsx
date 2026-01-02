import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, Minus, Check, ShoppingCart } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { toast } from 'sonner';

const PRODUCTS = [
  { id: 1, name: 'Riz', price: 500, unit: 'Kg', icon: '🍚' },
  { id: 2, name: 'Tomate', price: 200, unit: 'Kg', icon: '🍅' },
  { id: 3, name: 'Oignon', price: 300, unit: 'Kg', icon: '🧅' },
  { id: 4, name: 'Poisson', price: 1500, unit: 'Kg', icon: '🐟' },
  { id: 5, name: 'Poulet', price: 2000, unit: 'Pièce', icon: '🍗' },
  { id: 6, name: 'Banane', price: 150, unit: 'Régime', icon: '🍌' },
  { id: 7, name: 'Igname', price: 400, unit: 'Kg', icon: '🥔' },
  { id: 8, name: 'Huile', price: 800, unit: 'Litre', icon: '🛢️' },
];

export default function MerchantCashRegister() {
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<Record<number, number>>({});

  const updateQuantity = (productId: number, change: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const newQty = Math.max(0, current + change);
      if (newQty === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = PRODUCTS.find(p => p.id === Number(id));
    return sum + (product?.price || 0) * qty;
  }, 0);

  const handleValidate = () => {
    if (total === 0) {
      toast.error('Ajoute des produits avant de valider');
      return;
    }
    toast.success(`Vente enregistrée: ${total.toLocaleString()} FCFA`);
    setCart({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/merchant')}
        className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-100 text-gray-700 p-4 rounded-full shadow-lg transition-all"
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      <main className="container mx-auto px-4 py-12 pb-32">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 bg-orange-500 text-white px-8 py-4 rounded-full shadow-lg">
            <ShoppingCart className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              VENDRE
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {PRODUCTS.map(product => {
            const qty = cart[product.id] || 0;
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg p-6 border-4 border-gray-200"
              >
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">{product.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                  <p className="text-xl text-orange-600 font-semibold">{product.price} FCFA</p>
                  <p className="text-lg text-gray-500">/{product.unit}</p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    disabled={qty === 0}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-bold text-gray-900">{qty}</span>
                  </div>
                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-gray-200 shadow-2xl p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-2xl text-gray-600 mb-2">Total à encaisser</p>
              <p className="text-5xl font-black text-orange-600">
                {total.toLocaleString()} FCFA
              </p>
            </div>
            <button
              onClick={handleValidate}
              disabled={total === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-12 py-8 rounded-2xl shadow-xl transform hover:scale-105 active:scale-95 transition-all disabled:transform-none"
            >
              <Check className="w-12 h-12 mx-auto mb-2" />
              <span className="text-3xl font-bold">VALIDER</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
