import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Sparkles } from "lucide-react";
import { trpc } from "../lib/trpc";
import confetti from "canvas-confetti";

interface DailyReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function DailyReportModal({ open, onClose }: DailyReportModalProps) {
  const { data: merchant } = trpc.auth.myMerchant.useQuery();
  const { data: todayStats } = trpc.sales.todayStats.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: open && !!merchant?.id }
  );
  const { data: yesterdayStats } = trpc.sales.yesterdayStats.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: open && !!merchant?.id }
  );
  
  // Calculer la comparaison
  const comparison = todayStats && yesterdayStats ? {
    todayAmount: todayStats.totalAmount,
    todayCount: todayStats.salesCount,
    yesterdayAmount: yesterdayStats.totalAmount,
    variationAmount: todayStats.totalAmount - yesterdayStats.totalAmount,
    variationPercent: yesterdayStats.totalAmount > 0 
      ? ((todayStats.totalAmount - yesterdayStats.totalAmount) / yesterdayStats.totalAmount) * 100
      : 0
  } : null;
  
  const isLoading = !todayStats || !yesterdayStats;
  const { data: scoreData } = trpc.scores.getScore.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant?.id }
  );

  const [hasSpoken, setHasSpoken] = useState(false);

  useEffect(() => {
    if (open && comparison && !hasSpoken) {
      // Déclencher confetti si bonne journée
      if (comparison.todayAmount > comparison.yesterdayAmount) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }, 500);
      }

      // Synthèse vocale
      const message = `Bilan de journée. Tu as vendu ${comparison.todayAmount.toLocaleString("fr-FR")} francs CFA aujourd'hui. ${
        comparison.todayAmount > comparison.yesterdayAmount
          ? `Bravo ! C'est ${comparison.variationPercent.toFixed(0)} pourcent de plus qu'hier.`
          : comparison.todayAmount < comparison.yesterdayAmount
          ? `C'est ${Math.abs(comparison.variationPercent).toFixed(0)} pourcent de moins qu'hier. Demain sera meilleur.`
          : "C'est le même montant qu'hier."
      } ${
        scoreData && scoreData.totalScore >= 70
          ? `Ton score SUTA est de ${scoreData.totalScore} sur 100. Tu es éligible au micro-crédit.`
          : ""
      } Bon repos ${merchant?.businessName || ""}. À demain !`;

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = "fr-FR";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }

      setHasSpoken(true);
    }
  }, [open, comparison, hasSpoken, merchant, scoreData]);

  if (isLoading || !comparison) {
    return null;
  }

  const isPositive = comparison.todayAmount > comparison.yesterdayAmount;
  const isNeutral = comparison.todayAmount === comparison.yesterdayAmount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="text-center space-y-6">
          {/* Avatar SUTA qui applaudit */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src="/suta-avatar-3d.png"
                alt="SUTA"
                className="w-32 h-32 object-contain animate-bounce"
              />
              {isPositive && (
                <div className="absolute -top-2 -right-2 text-4xl animate-pulse">
                  🎉
                </div>
              )}
            </div>
          </div>

          {/* Titre */}
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
              🌙 Bilan de Journée
            </h2>
            <p className="text-gray-600 mt-2">
              Bon repos {merchant?.businessName || ""}. Voici ta journée en résumé.
            </p>
          </div>

          {/* Ventes du jour */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="text-sm text-gray-600 mb-2">Ventes du jour</div>
            <div className="text-5xl font-bold text-blue-600 mb-4">
              {comparison.todayAmount.toLocaleString("fr-FR")} <span className="text-2xl">FCFA</span>
            </div>
            <div className="text-sm text-gray-600">
              {comparison.todayCount} vente{comparison.todayCount > 1 ? "s" : ""} enregistrée
              {comparison.todayCount > 1 ? "s" : ""}
            </div>
          </Card>

          {/* Comparaison avec hier */}
          <Card className={`p-4 ${isPositive ? "bg-green-50 border-green-200" : isNeutral ? "bg-gray-50 border-gray-200" : "bg-orange-50 border-orange-200"} border-2`}>
            <div className="flex items-center justify-center gap-3">
              {isPositive ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : isNeutral ? (
                <Minus className="w-8 h-8 text-gray-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-orange-600" />
              )}
              <div className="text-left">
                <div className={`text-2xl font-bold ${isPositive ? "text-green-600" : isNeutral ? "text-gray-600" : "text-orange-600"}`}>
                  {isPositive ? "+" : isNeutral ? "" : ""}
                  {comparison.variationPercent.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">par rapport à hier</div>
              </div>
            </div>
            {isPositive && (
              <p className="text-green-700 font-medium mt-2">
                🎉 Bravo ! Tu as vendu {comparison.variationAmount.toLocaleString("fr-FR")} FCFA de plus qu'hier !
              </p>
            )}
            {!isPositive && !isNeutral && (
              <p className="text-orange-700 font-medium mt-2">
                💪 Demain sera meilleur ! Continue tes efforts.
              </p>
            )}
            {isNeutral && (
              <p className="text-gray-700 font-medium mt-2">
                ⚖️ Même montant qu'hier. Tu es régulier !
              </p>
            )}
          </Card>

          {/* Score SUTA */}
          {scoreData && (
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-center justify-center gap-3">
                <Trophy className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Ton Score SUTA</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {scoreData.totalScore} <span className="text-xl">/100</span>
                  </div>
                </div>
              </div>
              {scoreData.totalScore >= 70 && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                  <div className="flex items-center gap-2 text-green-800">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">
                      Tu es éligible au micro-crédit jusqu'à {scoreData.creditTier === 'platinum' ? '500000' : scoreData.creditTier === 'gold' ? '300000' : scoreData.creditTier === 'silver' ? '150000' : '50000'} FCFA !
                    </span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Objectif de demain */}
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-center justify-center gap-3">
              <Target className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-sm text-gray-600">Objectif de demain</div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(comparison.todayAmount * 1.1).toLocaleString("fr-FR")} FCFA
                </div>
                <div className="text-xs text-gray-500">+10% par rapport à aujourd'hui</div>
              </div>
            </div>
          </Card>

          {/* Bouton de fermeture */}
          <Button
            onClick={onClose}
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-bold text-lg h-14"
          >
            ✅ Merci SUTA, à demain !
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
