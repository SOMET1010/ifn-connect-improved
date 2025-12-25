import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSpeech } from '@/hooks/useSpeech';

interface StockAlertsBadgeProps {
  merchantId: number;
}

/**
 * Badge d'alertes de stock avec notification vocale automatique
 */
export function StockAlertsBadge({ merchantId }: StockAlertsBadgeProps) {
  const { data: lowStockItems = [] } = trpc.stock.lowStock.useQuery(
    { merchantId },
    { refetchInterval: 60000 } // Rafraîchir toutes les minutes
  );
  
  const { speakAlert, isEnabled: speechEnabled } = useSpeech();
  
  // Notification vocale automatique quand il y a des produits en stock bas
  useEffect(() => {
    if (lowStockItems.length > 0 && speechEnabled) {
      const criticalItems = lowStockItems.filter(item => 
        parseFloat(item.quantity) < parseFloat(item.minThreshold || '5')
      );
      
      if (criticalItems.length > 0) {
        const productNames = criticalItems.slice(0, 3).map(item => item.productName).join(', ');
        speakAlert(`Attention ! Stock critique pour : ${productNames}`);
      }
    }
  }, [lowStockItems.length, speechEnabled]);
  
  if (lowStockItems.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce">
      <div className="bg-red-500 text-white rounded-full p-4 shadow-2xl flex items-center gap-3">
        <AlertTriangle className="w-8 h-8" />
        <div>
          <p className="font-bold text-lg">Stock bas !</p>
          <p className="text-sm">{lowStockItems.length} produit(s)</p>
        </div>
        <div className="bg-white text-red-500 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl">
          {lowStockItems.length}
        </div>
      </div>
    </div>
  );
}
