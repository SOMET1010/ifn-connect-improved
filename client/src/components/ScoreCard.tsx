import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { RefreshCw, TrendingUp, Award, Info } from "lucide-react";
import { useState } from "react";

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
          <Button onClick={handleCalculate} disabled={isCalculating}>
            {isCalculating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Calcul en cours...
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

  // Calculer le pourcentage pour la jauge
  const percentage = totalScore;

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

      {/* Score principal */}
      <div className="mb-6">
        <div className="flex items-end justify-center gap-2 mb-2">
          <span className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
            {totalScore}
          </span>
          <span className="text-2xl text-muted-foreground mb-2">/100</span>
        </div>
        
        {/* Jauge de progression */}
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Tier */}
        <div className="text-center mt-4">
          <span className={`text-lg font-semibold ${tierColors[tier]}`}>
            {tierLabels[tier]}
          </span>
        </div>
      </div>

      {/* Éligibilité crédit */}
      {isEligible ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-1">
                🎉 Éligible au Micro-Crédit !
              </h4>
              <p className="text-sm text-green-700">
                Vous pouvez emprunter jusqu'à{" "}
                <span className="font-bold">{maxCredit.toLocaleString()} FCFA</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 mb-1">
                Continuez vos efforts !
              </h4>
              <p className="text-sm text-orange-700">
                Score minimum requis : 35/100 pour le niveau Bronze
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Détail des composantes */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Détail du score
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
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {score}/{max}
        </span>
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
