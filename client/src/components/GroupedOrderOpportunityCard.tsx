import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, Users, Package, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

interface GroupedOrderOpportunityCardProps {
  productName: string;
  participantsCount: number;
  totalQuantity: number;
  estimatedSavings: number;
  orderId: number;
}

/**
 * Carte d'opportunité de commande groupée
 * Affiche les économies potentielles et incite à rejoindre
 */
export function GroupedOrderOpportunityCard({
  productName,
  participantsCount,
  totalQuantity,
  estimatedSavings,
  orderId,
}: GroupedOrderOpportunityCardProps) {
  const [, setLocation] = useLocation();

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:shadow-lg transition-all">
      <div className="space-y-4">
        {/* Header avec badge d'économies */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-800">{productName}</h3>
            </div>
            <p className="text-sm text-gray-600">Commande groupée en cours</p>
          </div>
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            -{estimatedSavings.toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Participants</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{participantsCount}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Quantité totale</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalQuantity}</p>
          </div>
        </div>

        {/* Message d'économies */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-3">
          <p className="text-sm font-semibold text-green-800 text-center">
            💰 Économise sur le transport en rejoignant cette commande !
          </p>
        </div>

        {/* Bouton d'action */}
        <Button
          onClick={() => setLocation(`/cooperative/grouped-orders?highlight=${orderId}`)}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-12"
        >
          Rejoindre la commande
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </Card>
  );
}
