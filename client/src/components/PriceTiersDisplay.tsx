import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, Target, Trophy, ArrowRight } from 'lucide-react';

interface PriceTier {
  minQuantity: number;
  discountPercent: number;
  pricePerUnit: number;
}

interface PriceTiersDisplayProps {
  tiers: Array<{
    id: number;
    minQuantity: number;
    discountPercent: string;
    pricePerUnit: string;
  }>;
  currentQuantity: number;
  basePrice: number;
  activeTier?: PriceTier | null;
  nextTier?: (PriceTier & { quantityNeeded: number }) | null;
}

export function PriceTiersDisplay({
  tiers,
  currentQuantity,
  basePrice,
  activeTier,
  nextTier,
}: PriceTiersDisplayProps) {
  if (!tiers || tiers.length === 0) {
    return null;
  }

  // Calculer le pourcentage de progression vers le prochain palier
  const progressPercent = nextTier
    ? ((currentQuantity / nextTier.minQuantity) * 100)
    : 100;

  // Calculer les économies réalisées
  const currentPrice = activeTier ? activeTier.pricePerUnit : basePrice;
  const savings = basePrice > 0 ? ((basePrice - currentPrice) / basePrice) * 100 : 0;
  const totalSavings = (basePrice - currentPrice) * currentQuantity;

  return (
    <div className="space-y-4">
      {/* Palier actif */}
      {activeTier && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-600" />
                Palier actif
              </CardTitle>
              <Badge className="bg-green-600 text-white">
                -{activeTier.discountPercent}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Prix unitaire actuel</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeTier.pricePerUnit.toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Au lieu de {basePrice.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Économies réalisées</p>
                <p className="text-2xl font-bold text-green-600">
                  {savings.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Soit {totalSavings.toLocaleString('fr-FR')} FCFA au total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prochain palier */}
      {nextTier && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Prochain palier
              </CardTitle>
              <Badge className="bg-blue-600 text-white">
                -{nextTier.discountPercent}%
              </Badge>
            </div>
            <CardDescription>
              Plus que <strong>{nextTier.quantityNeeded}</strong> unités pour débloquer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progression</span>
                <span className="font-semibold text-blue-600">
                  {currentQuantity} / {nextTier.minQuantity} unités
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm text-gray-600">Futur prix unitaire</p>
                  <p className="text-xl font-bold text-blue-600">
                    {nextTier.pricePerUnit.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Économie supplémentaire</p>
                  <p className="text-xl font-bold text-blue-600">
                    {((currentPrice - nextTier.pricePerUnit) * currentQuantity).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tous les paliers disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-indigo-600" />
            Tous les paliers de prix
          </CardTitle>
          <CardDescription>
            Plus vous commandez ensemble, plus le prix baisse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tiers.map((tier, index) => {
              const isActive = activeTier && tier.minQuantity === activeTier.minQuantity;
              const isReached = currentQuantity >= tier.minQuantity;
              
              return (
                <div
                  key={tier.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-green-500 bg-green-50'
                      : isReached
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        isActive
                          ? 'bg-green-500 text-white'
                          : isReached
                          ? 'bg-gray-400 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        À partir de {tier.minQuantity} unités
                      </p>
                      <p className="text-sm text-gray-600">
                        Réduction de {parseFloat(tier.discountPercent).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {parseFloat(tier.pricePerUnit).toLocaleString('fr-FR')} FCFA
                    </p>
                    {isActive && (
                      <Badge className="bg-green-600 text-white mt-1">Actif</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
