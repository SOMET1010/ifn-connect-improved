import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { PiggyBank, TrendingUp, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SavingsSuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleAmount: number;
}

export function SavingsSuggestionDialog({
  isOpen,
  onClose,
  saleAmount,
}: SavingsSuggestionDialogProps) {
  const { merchant } = useAuth();
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  // Calculer les montants suggérés (5%, 10%, 15%)
  const suggestedAmounts = [
    { percentage: 5, amount: Math.round(saleAmount * 0.05) },
    { percentage: 10, amount: Math.round(saleAmount * 0.1) },
    { percentage: 15, amount: Math.round(saleAmount * 0.15) },
  ];

  // Récupérer les cagnottes actives
  const { data: goals } = trpc.savings.getGoals.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant && isOpen }
  );

  const activeGoals = goals?.filter((g) => !g.isCompleted) || [];

  // Mutation pour ajouter un dépôt
  const depositMutation = trpc.savings.addDeposit.useMutation({
    onSuccess: () => {
      alert("Bravo ! Votre épargne a été ajoutée avec succès ! 🎉");
      onClose();
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
    },
  });

  const handleSave = (amount: number) => {
    if (!merchant || !selectedGoalId) {
      alert("Veuillez sélectionner une cagnotte");
      return;
    }

    depositMutation.mutate({
      savingsGoalId: selectedGoalId,
      merchantId: merchant.id,
      amount,
      source: "sale_suggestion",
      notes: `Épargne automatique après vente de ${saleAmount} FCFA`,
    });
  };

  const handleCustomSave = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }
    handleSave(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            Félicitations pour cette vente ! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message d'encouragement */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Sparkles className="w-8 h-8 text-pink-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-pink-900 mb-2">
                  Tu as vendu {saleAmount.toLocaleString()} FCFA !
                </h3>
                <p className="text-pink-700">
                  C'est le moment idéal pour mettre de côté une petite partie pour tes projets futurs. 
                  Même un petit montant aujourd'hui peut faire une grande différence demain ! 💪
                </p>
              </div>
            </div>
          </div>

          {/* Sélection de la cagnotte */}
          {activeGoals.length > 0 ? (
            <div>
              <Label className="text-lg font-semibold mb-3 block">
                Dans quelle cagnotte veux-tu épargner ?
              </Label>
              <div className="grid grid-cols-1 gap-3">
                {activeGoals.map((goal) => {
                  const current = parseFloat(goal.currentAmount);
                  const target = parseFloat(goal.targetAmount);
                  const progress = (current / target) * 100;

                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoalId(goal.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedGoalId === goal.id
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg">{goal.name}</h4>
                        <TrendingUp className="w-5 h-5 text-pink-600" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-pink-500 to-rose-600 transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {current.toLocaleString()} / {target.toLocaleString()} FCFA
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <PiggyBank className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                Tu n'as pas encore de cagnotte. Crée-en une d'abord !
              </p>
              <Button
                onClick={() => {
                  onClose();
                  window.location.href = "/merchant/savings";
                }}
                className="bg-gradient-to-r from-pink-500 to-rose-600"
              >
                Créer une cagnotte
              </Button>
            </div>
          )}

          {/* Montants suggérés */}
          {activeGoals.length > 0 && (
            <>
              <div>
                <Label className="text-lg font-semibold mb-3 block">
                  Combien veux-tu épargner ?
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {suggestedAmounts.map((suggested) => (
                    <button
                      key={suggested.percentage}
                      onClick={() => handleSave(suggested.amount)}
                      disabled={!selectedGoalId || depositMutation.isPending}
                      className="p-6 rounded-lg border-2 border-pink-200 hover:border-pink-500 hover:bg-pink-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-3xl font-bold text-pink-600 mb-1">
                        {suggested.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {suggested.percentage}% de la vente
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant personnalisé */}
              <div>
                <Label htmlFor="customAmount" className="text-sm font-medium mb-2 block">
                  Ou entre un montant personnalisé
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="customAmount"
                    type="number"
                    placeholder="Ex: 1000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCustomSave}
                    disabled={!selectedGoalId || !customAmount || depositMutation.isPending}
                    className="bg-gradient-to-r from-pink-500 to-rose-600"
                  >
                    Épargner
                  </Button>
                </div>
              </div>

              {/* Bouton passer */}
              <div className="text-center">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-muted-foreground"
                >
                  Pas maintenant
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
