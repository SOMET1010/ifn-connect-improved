import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { RefreshCw, TrendingUp, Award, Info } from "lucide-react";
import { useState } from "react";
import { ScoreGauge } from "./ScoreGauge";

interface ScoreCardProps {
  merchantId: number;
}

const tierColors = {
  none: "text-gray-500",
  bronze: "text-orange-600",
  silver: "text-gray-400",
  gold: "text-yellow-500",
  platinum: "text-purple-600",
};

const tierBgColors = {
  none: "bg-gray-100 border-gray-300",
  bronze: "bg-orange-100 border-orange-300",
  silver: "bg-gray-100 border-gray-300",
  gold: "bg-yellow-100 border-yellow-300",
  platinum: "bg-purple-100 border-purple-300",
};

const tierLabels = {
  none: "Aucun",
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platinum: "Platine",
};

export function ScoreCard({ merchantId }: ScoreCardProps) {
  const [isCalculating, setIsCalculating] = useState(false);

  // Récupérer le score
  const { data: score, refetch } = trpc.scores.getScore.useQuery(
    { merchantId },
    { enabled: !!merchantId }
  );

  // Mutation pour recalculer
  const calculateMutation = trpc.scores.calculateScore.useMutation({
    onSuccess: () => {
      refetch();
      setIsCalculating(false);
    },
    onError: () => {
      setIsCalculating(false);
    },
  });

  const handleCalculate = () => {
    setIsCalculating(true);
    calculateMutation.mutate({ merchantId });
  };

  if (!score) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Award className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Score SUTA non calculé</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Calculez votre Score de Confiance pour accéder au micro-crédit
          </p>
          <Button onClick={handleCalculate} disabled={isCalculating} className="relative overflow-hidden">
            {isCalculating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Calcul en cours...
                {/* Barre de progression animée */}
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-green-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Calculer mon score
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  const totalScore = score.totalScore;
  const tier = score.creditTier;
  const isEligible = score.isEligibleForCredit;
  const maxCredit = parseFloat(score.maxCreditAmount);

  return (
    <Card className="p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Score SUTA</h3>
            <p className="text-sm text-muted-foreground">Score de Confiance</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCalculate}
          disabled={isCalculating}
        >
          <RefreshCw className={`w-4 h-4 ${isCalculating ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Jauge circulaire au centre */}
      <div className="flex justify-center mb-6">
        <ScoreGauge score={totalScore} size={220} strokeWidth={24} />
      </div>

      {/* Badge Tier */}
      <div className="flex justify-center mb-6">
        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 ${tierBgColors[tier]}`}>
          <Award className={`w-6 h-6 ${tierColors[tier]}`} />
          <span className={`text-xl font-bold ${tierColors[tier]}`}>
            {tierLabels[tier]}
          </span>
        </div>
      </div>

      {/* Éligibilité crédit */}
      {isEligible ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-1 text-lg">
                🎉 Éligible au Micro-Crédit !
              </h4>
              <p className="text-base text-green-700">
                Vous pouvez emprunter jusqu'à{" "}
                <span className="font-bold text-xl">{maxCredit.toLocaleString()} FCFA</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-orange-900 mb-1 text-lg">
                Continuez vos efforts !
              </h4>
              <p className="text-base text-orange-700">
                Score minimum requis : <span className="font-bold">35/100</span> pour le niveau Bronze
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Détail des composantes */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-gray-700 mb-3">
          📊 Détail du score
        </h4>
        
        <ScoreComponent
          label="Régularité des ventes"
          score={score.regularityScore}
          max={30}
          detail={`${score.consecutiveSalesDays} jours consécutifs`}
        />
        
        <ScoreComponent
          label="Volume de transactions"
          score={score.volumeScore}
          max={20}
          detail={`${parseFloat(score.totalSalesAmount).toLocaleString()} FCFA`}
        />
        
        <ScoreComponent
          label="Épargne régulière"
          score={score.savingsScore}
          max={20}
          detail={`${parseFloat(score.totalSavingsAmount).toLocaleString()} FCFA`}
        />
        
        <ScoreComponent
          label="Utilisation de l'app"
          score={score.usageScore}
          max={15}
          detail={`${score.appUsageDays} jours d'activité`}
        />
        
        <ScoreComponent
          label="Ancienneté"
          score={score.seniorityScore}
          max={15}
          detail={`${score.accountAgeDays} jours`}
        />
      </div>

      {/* Conseils */}
      <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <p className="text-sm text-blue-900">
          <strong>💡 Conseil :</strong> Enregistrez vos ventes chaque jour et épargnez
          régulièrement pour améliorer votre score !
        </p>
      </div>
    </Card>
  );
}

interface ScoreComponentProps {
  label: string;
  score: number;
  max: number;
  detail: string;
}

function ScoreComponent({ label, score, max, detail }: ScoreComponentProps) {
  const percentage = (score / max) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="font-bold text-base">
          {score}/{max}
        </span>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-1.5">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-600">{detail}</p>
    </div>
  );
}
