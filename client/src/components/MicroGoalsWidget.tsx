import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Target, TrendingUp, CheckCircle2, X } from "lucide-react";
import { trpc } from "../lib/trpc";
import confetti from "canvas-confetti";

interface MicroGoalsWidgetProps {
  merchantId: number;
}

export function MicroGoalsWidget({ merchantId }: MicroGoalsWidgetProps) {
  const [dismissedGoals, setDismissedGoals] = useState<number[]>([]);
  const { data: todayStats } = trpc.sales.todayStats.useQuery({ merchantId });
  const { data: yesterdayStats } = trpc.sales.yesterdayStats.useQuery({ merchantId });
  const { data: scoreData } = trpc.scores.getScore.useQuery({ merchantId });

  // Générer des micro-objectifs dynamiques basés sur l'historique
  const generateGoals = () => {
    if (!todayStats || !yesterdayStats) return [];

    const goals = [];
    const todayAmount = todayStats.totalAmount;
    const yesterdayAmount = yesterdayStats.totalAmount;
    const todayCount = todayStats.salesCount;

    // Objectif 1 : Dépasser hier de 10%
    if (todayAmount < yesterdayAmount * 1.1) {
      const target = Math.round(yesterdayAmount * 1.1);
      const remaining = target - todayAmount;
      goals.push({
        id: 1,
        title: "🎯 Dépasse hier de 10%",
        description: `Encore ${remaining.toLocaleString("fr-FR")} FCFA pour atteindre ${target.toLocaleString("fr-FR")} FCFA`,
        progress: (todayAmount / target) * 100,
        completed: todayAmount >= target,
        type: "sales_target",
      });
    }

    // Objectif 2 : Faire 5 ventes dans la journée
    if (todayCount < 5) {
      goals.push({
        id: 2,
        title: "📊 5 ventes aujourd'hui",
        description: `Encore ${5 - todayCount} vente${5 - todayCount > 1 ? "s" : ""} à enregistrer`,
        progress: (todayCount / 5) * 100,
        completed: todayCount >= 5,
        type: "sales_count",
      });
    }

    // Objectif 3 : Améliorer son score SUTA
    if (scoreData && scoreData.totalScore < 80) {
      goals.push({
        id: 3,
        title: "⭐ Score SUTA à 80",
        description: `Encore ${80 - scoreData.totalScore} points pour débloquer le niveau Gold`,
        progress: (scoreData.totalScore / 80) * 100,
        completed: scoreData.totalScore >= 80,
        type: "score_improvement",
      });
    }

    // Objectif 4 : Atteindre 50 000 FCFA dans la journée
    if (todayAmount < 50000) {
      goals.push({
        id: 4,
        title: "💰 50 000 FCFA aujourd'hui",
        description: `Encore ${(50000 - todayAmount).toLocaleString("fr-FR")} FCFA`,
        progress: (todayAmount / 50000) * 100,
        completed: todayAmount >= 50000,
        type: "daily_milestone",
      });
    }

    return goals.filter((g) => !dismissedGoals.includes(g.id));
  };

  const goals = generateGoals();

  // Déclencher confetti quand un objectif est atteint
  useEffect(() => {
    const completedGoals = goals.filter((g) => g.completed);
    if (completedGoals.length > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      // Synthèse vocale
      if ("speechSynthesis" in window) {
        const message = `Bravo ! Tu as atteint ton objectif : ${completedGoals[0].title}`;
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = "fr-FR";
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [goals]);

  const handleDismiss = (goalId: number) => {
    setDismissedGoals([...dismissedGoals, goalId]);
    localStorage.setItem("dismissedGoals", JSON.stringify([...dismissedGoals, goalId]));
  };

  // Charger les objectifs dismissés depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dismissedGoals");
    if (stored) {
      setDismissedGoals(JSON.parse(stored));
    }
  }, []);

  // Réinitialiser les objectifs dismissés chaque jour
  useEffect(() => {
    const lastReset = localStorage.getItem("lastGoalsReset");
    const today = new Date().toDateString();
    if (lastReset !== today) {
      setDismissedGoals([]);
      localStorage.setItem("dismissedGoals", JSON.stringify([]));
      localStorage.setItem("lastGoalsReset", today);
    }
  }, []);

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center gap-3">
        <Target className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-900">🎯 Tes Objectifs du Jour</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            className={`border-2 ${
              goal.completed
                ? "bg-green-50 border-green-300"
                : "bg-white border-orange-200"
            } relative`}
          >
            <CardContent className="p-4">
              {/* Bouton de fermeture */}
              <button aria-label="Fermer cette suggestion"
                onClick={() => handleDismiss(goal.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Titre */}
              <div className="flex items-center gap-2 mb-2">
                {goal.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                )}
                <h3 className="font-bold text-lg">{goal.title}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">{goal.description}</p>

              {/* Barre de progression */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      goal.completed ? "bg-green-500" : "bg-orange-500"
                    }`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {Math.round(goal.progress)}%
                </div>
              </div>

              {/* Badge de statut */}
              {goal.completed && (
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Objectif atteint ! 🎉</span>
                </div>
              )}

              {!goal.completed && (
                <Button
                  onClick={() => {
                    // Rediriger vers la caisse pour faire une vente
                    window.location.href = "/merchant/cash-register-simple";
                  }}
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  Faire une vente maintenant
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message d'encouragement */}
      {goals.some((g) => g.completed) && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-yellow-900">
              🎉 Bravo ! Continue comme ça, tu es sur la bonne voie !
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
