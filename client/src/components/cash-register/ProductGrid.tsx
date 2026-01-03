import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { audioManager } from '@/lib/audioManager';

interface Product {
  id: number;
  name: string;
  basePrice: string;
  unit: string;
}

interface ProductGridProps {
  products: Product[];
  selectedProductId: number | null;
  onSelectProduct: (productId: number) => void;
  isLoading?: boolean;
}

export default function ProductGrid({
  products,
  selectedProductId,
  onSelectProduct,
  isLoading = false,
}: ProductGridProps) {
  const handleProductClick = (productId: number) => {
    audioManager.provideFeedback('tap');
    onSelectProduct(productId);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 h-24 animate-pulse bg-gray-200" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Aucun produit disponible</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {products.map((product) => {
        const isSelected = selectedProductId === product.id;
        return (
          <Card
            key={product.id}
            onClick={() => handleProductClick(product.id)}
            className={`
              p-4 cursor-pointer transition-all hover:shadow-md relative
              ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}
            `}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="text-center">
              <p className="font-bold text-lg mb-1">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {parseInt(product.basePrice).toLocaleString('fr-FR')} FCFA/{product.unit}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
