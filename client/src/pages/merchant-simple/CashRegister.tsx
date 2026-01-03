import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, Minus, Check, ShoppingCart } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { AfricanPattern } from '@/components/ui/african-pattern';
import { toast } from 'sonner';

const PRODUCTS = [
  { id: 1, name: 'Riz', price: 500, unit: 'Kg', icon: '🍚', image: '/product-images/riz.jpg' },
  { id: 2, name: 'Tomate', price: 200, unit: 'Kg', icon: '🍅', image: '/product-images/tomates.jpg' },
  { id: 3, name: 'Oignon', price: 300, unit: 'Kg', icon: '🧅', image: '/product-images/oignons.jpg' },
  { id: 4, name: 'Poisson', price: 1500, unit: 'Kg', icon: '🐟', image: '/product-images/tilapia.jpg' },
  { id: 5, name: 'Poulet', price: 2000, unit: 'Pièce', icon: '🍗', image: '/product-images/poulet.jpg' },
  { id: 6, name: 'Banane', price: 150, unit: 'Régime', icon: '🍌', image: '/product-images/bananes.jpg' },
  { id: 7, name: 'Igname', price: 400, unit: 'Kg', icon: '🥔', image: '/product-images/igname.jpg' },
  { id: 8, name: 'Huile', price: 800, unit: 'Litre', icon: '🛢️', image: '/product-images/huile.jpg' },
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background marché vibrant */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/marche-ivoirien.jpg)',
          filter: 'brightness(0.85) saturate(1.3) contrast(1.05)',
        }}
      />

      {/* Overlay dégradé terre */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D35400]/35 via-[#E67E22]/25 to-[#27AE60]/30" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <InstitutionalHeader />

        {/* Bouton retour Glassmorphism */}
        <button
          onClick={() => setLocation('/merchant')}
          className="fixed top-24 left-4 z-50 backdrop-blur-xl bg-white/90 hover:bg-white text-[#C25E00] p-4 rounded-full shadow-xl hover:shadow-2xl border-2 border-white/30 transition-all transform hover:scale-105"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <main className="flex-1 container mx-auto px-4 py-8 pb-32">
          {/* Header avec mascotte */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-6 backdrop-blur-2xl bg-gradient-to-r from-[#C25E00]/90 to-[#E67E22]/90 text-white px-10 py-6 rounded-full shadow-2xl border-2 border-[#F39C12]/30 relative overflow-hidden">
              {/* Motif Wax */}
              <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
                <AfricanPattern variant="wax" opacity={0.5} />
              </div>

              <ShoppingCart className="w-14 h-14 relative z-10" />
              <h1 className="text-4xl md:text-5xl font-bold relative z-10">
                VENDRE
              </h1>
            </div>
          </div>

          {/* Grid de produits Glassmorphism */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {PRODUCTS.map(product => {
              const qty = cart[product.id] || 0;
              return (
                <div
                  key={product.id}
                  className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 border-2 border-white/30 relative overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
                >
                  {/* Motif en arrière-plan */}
                  <div className="absolute inset-0 text-[#C25E00] opacity-[0.03] pointer-events-none">
                    <AfricanPattern variant="geometric" opacity={0.3} />
                  </div>

                  <div className="relative z-10">
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-3">{product.icon}</div>
                      <h3 className="text-2xl font-bold text-[#2D3436]">{product.name}</h3>
                      <p className="text-xl text-[#C25E00] font-bold mt-2">{product.price} F</p>
                      <p className="text-base text-[#636E72]">/{product.unit}</p>
                    </div>

                    {/* Contrôles quantité */}
                    <div className="flex items-center justify-between gap-2 mt-4">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        disabled={qty === 0}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 disabled:transform-none"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-3xl font-bold text-[#2D3436]">{qty}</span>
                      </div>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Barre de Total Glassmorphism */}
        <div className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl bg-gradient-to-r from-[#D35400]/95 via-[#E67E22]/95 to-[#F39C12]/95 border-t-4 border-[#F1C40F]/50 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] p-6 relative overflow-hidden">
          {/* Motif Wax */}
          <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
            <AfricanPattern variant="wax" opacity={0.5} />
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-xl text-white/90 mb-2 font-semibold">Total à encaisser</p>
                <p className="text-5xl font-black text-white drop-shadow-2xl">
                  {total.toLocaleString()} F
                </p>
              </div>
              <button
                onClick={handleValidate}
                disabled={total === 0}
                className="bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] hover:from-[#1B5E20] hover:to-[#2E7D32] disabled:from-gray-400 disabled:to-gray-500 text-white px-12 py-8 rounded-full shadow-2xl hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transform hover:scale-105 active:scale-95 transition-all disabled:transform-none border-2 border-white/30"
              >
                <Check className="w-12 h-12 mx-auto mb-2" />
                <span className="text-3xl font-bold">VALIDER</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
