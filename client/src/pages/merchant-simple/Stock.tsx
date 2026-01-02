import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Package, Search, AlertTriangle, TrendingUp, Plus, Minus, Check } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { trpc } from '@/lib/trpc';

export default function MerchantStock() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);

  const { data: products = [], refetch } = trpc.products.list.useQuery();
  const updateStockMutation = trpc.products.updateStock.useMutation({
    onSuccess: () => {
      refetch();
      setEditingProduct(null);
      setNewQuantity(0);
    }
  });

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const lowStockProducts = products.filter(p => (p.stock || 0) < 5);
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
  const totalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);

  const handleUpdateStock = (productId: number, adjustment: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, (product.stock || 0) + adjustment);
    updateStockMutation.mutate({ productId, quantity: newStock });
  };

  const handleSaveQuantity = (productId: number) => {
    if (newQuantity >= 0) {
      updateStockMutation.mutate({ productId, quantity: newQuantity });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(34,197,94,0.15),transparent_50%)]" />

      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/merchant')}
        className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 p-3 rounded-2xl shadow-lg transition-all hover:scale-105"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 animate-[slideDown_0.5s_ease-out]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
              Mon Stock
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-[slideUp_0.6s_ease-out]">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Produits Total</p>
              <Package className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{products.length}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 shadow-lg text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Stock Faible</p>
              <AlertTriangle className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{lowStockProducts.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-lg text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Valeur Stock</p>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{totalValue.toLocaleString()} F</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg mb-6 animate-[slideUp_0.7s_ease-out]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>
        </div>

        {outOfStockProducts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 animate-[slideUp_0.8s_ease-out]">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-900">Rupture de Stock</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {outOfStockProducts.map(product => (
                <span key={product.id} className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                  {product.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-[slideUp_0.9s_ease-out]">
          {filteredProducts.map((product, index) => {
            const isLowStock = (product.stock || 0) < 5;
            const isOutOfStock = (product.stock || 0) === 0;
            const isEditing = editingProduct === product.id;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl p-5 shadow-lg border-2 transition-all hover:shadow-xl ${
                  isOutOfStock ? 'border-red-300' : isLowStock ? 'border-orange-300' : 'border-gray-200'
                }`}
                style={{
                  animation: `slideUp 0.6s ease-out ${index * 0.05}s backwards`
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                    {product.category && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                        {product.category}
                      </span>
                    )}
                  </div>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-xl ml-3"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Prix unitaire</p>
                    <p className="text-lg font-bold text-gray-900">{product.price?.toLocaleString() || 0} F</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl font-bold text-lg ${
                    isOutOfStock ? 'bg-red-100 text-red-700' :
                    isLowStock ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {product.stock || 0} en stock
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl text-center text-lg font-bold focus:outline-none focus:border-orange-400"
                      placeholder="Nouvelle quantité"
                      min="0"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveQuantity(product.id)}
                        disabled={updateStockMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Valider
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setNewQuantity(0);
                        }}
                        className="px-4 bg-gray-200 text-gray-700 py-2 rounded-xl font-bold hover:bg-gray-300 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStock(product.id, -1)}
                      disabled={updateStockMutation.isPending || (product.stock || 0) === 0}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Minus className="w-5 h-5" />
                      -1
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(product.id);
                        setNewQuantity(product.stock || 0);
                      }}
                      className="px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleUpdateStock(product.id, 1)}
                      disabled={updateStockMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      +1
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">Aucun produit trouvé</p>
          </div>
        )}
      </main>
    </div>
  );
}
