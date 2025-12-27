import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { PiggyBank, Plus, TrendingUp, Calendar, CheckCircle2, Coins } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";


const PREDEFINED_GOALS = [
  { name: "Tabaski", icon: "🕌", color: "from-green-500 to-emerald-600" },
  { name: "Rentrée scolaire", icon: "📚", color: "from-blue-500 to-cyan-600" },
  { name: "Stock", icon: "📦", color: "from-orange-500 to-amber-600" },
  { name: "Urgence", icon: "🚨", color: "from-red-500 to-rose-600" },
  { name: "Personnalisée", icon: "💡", color: "from-purple-500 to-pink-600" },
];

export function SavingsGoals() {
  const { merchant } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
  });
  const [depositAmount, setDepositAmount] = useState("");

  // Récupérer les cagnottes
  const { data: goals, refetch } = trpc.savings.getGoals.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  // Récupérer les stats
  const { data: stats } = trpc.savings.getStats.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  // Mutation pour créer une cagnotte
  const createMutation = trpc.savings.createGoal.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setNewGoal({ name: "", targetAmount: "", deadline: "" });
      alert("Cagnotte créée !: Votre objectif d'épargne a été créé avec succès.");
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour ajouter un dépôt
  const depositMutation = trpc.savings.addDeposit.useMutation({
    onSuccess: () => {
      refetch();
      setIsDepositOpen(false);
      setSelectedGoal(null);
      setDepositAmount("");
      alert("Dépôt ajouté !: Votre épargne a été mise à jour.");
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
    },
  });

  const handleCreateGoal = () => {
    if (!merchant || !newGoal.name || !newGoal.targetAmount) {
      alert("Erreur: Veuillez remplir tous les champs obligatoires.");
      return;
    }

    createMutation.mutate({
      merchantId: merchant.id,
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      deadline: newGoal.deadline ? new Date(newGoal.deadline) : undefined,
    });
  };

  const handleDeposit = () => {
    if (!merchant || !selectedGoal || !depositAmount) {
      alert("Erreur: Veuillez entrer un montant valide.");
      return;
    }

    depositMutation.mutate({
      savingsGoalId: selectedGoal,
      merchantId: merchant.id,
      amount: parseFloat(depositAmount),
      source: "manual",
    });
  };

  const openDepositDialog = (goalId: number) => {
    setSelectedGoal(goalId);
    setIsDepositOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-green-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total épargné</p>
              <p className="text-2xl font-bold">{stats?.totalSavings.toLocaleString() || 0} FCFA</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cagnottes actives</p>
              <p className="text-2xl font-bold">{stats?.activeGoals || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Objectifs atteints</p>
              <p className="text-2xl font-bold">{stats?.completedGoals || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bouton créer */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mes Cagnottes</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-green-500">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle cagnotte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle cagnotte</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Cagnottes prédéfinies */}
              <div>
                <Label>Choisir un type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PREDEFINED_GOALS.map((goal) => (
                    <button aria-label="Sélectionner cet objectif prédéfini"
                      key={goal.name}
                      onClick={() => setNewGoal({ ...newGoal, name: goal.name })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        newGoal.name === goal.name
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-3xl mb-2">{goal.icon}</div>
                      <div className="text-xs font-medium">{goal.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nom personnalisé */}
              {newGoal.name === "Personnalisée" && (
                <div>
                  <Label htmlFor="customName">Nom de la cagnotte</Label>
                  <Input
                    id="customName"
                    placeholder="Ex: Voyage, Mariage..."
                    value={newGoal.name === "Personnalisée" ? "" : newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  />
                </div>
              )}

              {/* Montant objectif */}
              <div>
                <Label htmlFor="targetAmount">Montant objectif (FCFA)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="Ex: 100000"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                />
              </div>

              {/* Date limite */}
              <div>
                <Label htmlFor="deadline">Date limite (optionnel)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>

              <Button
                onClick={handleCreateGoal}
                disabled={createMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-500 to-green-500"
              >
                {createMutation.isPending ? "Création..." : "Créer la cagnotte"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des cagnottes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals?.map((goal) => {
          const current = parseFloat(goal.currentAmount);
          const target = parseFloat(goal.targetAmount);
          const progress = (current / target) * 100;
          const predefinedGoal = PREDEFINED_GOALS.find((g) => g.name === goal.name);

          return (
            <Card key={goal.id} className="p-6">
              {/* En-tête */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${predefinedGoal?.color || "from-gray-400 to-gray-600"} flex items-center justify-center text-2xl`}
                >
                  {predefinedGoal?.icon || "💰"}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{goal.name}</h3>
                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {goal.isCompleted && (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
              </div>

              {/* Montants */}
              <div className="mb-4">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold">{current.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">/ {target.toLocaleString()} FCFA</span>
                </div>

                {/* Barre de progression */}
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${predefinedGoal?.color || "from-gray-400 to-gray-600"} transition-all duration-500`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {Math.round(progress)}%
                </p>
              </div>

              {/* Bouton ajouter */}
              <Button
                onClick={() => openDepositDialog(goal.id)}
                variant="outline"
                className="w-full"
                disabled={goal.isCompleted}
              >
                <Coins className="w-4 h-4 mr-2" />
                Ajouter de l'épargne
              </Button>
            </Card>
          );
        })}

        {/* Message si aucune cagnotte */}
        {(!goals || goals.length === 0) && (
          <Card className="p-12 col-span-full text-center">
            <PiggyBank className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Aucune cagnotte</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première cagnotte pour commencer à épargner !
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-green-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première cagnotte
            </Button>
          </Card>
        )}
      </div>

      {/* Dialog pour ajouter un dépôt */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter de l'épargne</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="depositAmount">Montant à épargner (FCFA)</Label>
              <Input
                id="depositAmount"
                type="number"
                placeholder="Ex: 5000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleDeposit}
              disabled={depositMutation.isPending}
              className="w-full bg-gradient-to-r from-orange-500 to-green-500"
            >
              {depositMutation.isPending ? "Ajout en cours..." : "Ajouter"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
