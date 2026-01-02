import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Wallet, Target, TrendingUp, PiggyBank, Plus, Calendar } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MerchantSavings() {
  const [, setLocation] = useLocation();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const { data: goals = [], refetch } = trpc.savings.getGoals.useQuery();
  const { data: transactions = [] } = trpc.savings.getTransactions.useQuery();
  const createGoalMutation = trpc.savings.createGoal.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddGoal(false);
      setGoalName('');
      setGoalTarget('');
    }
  });

  const totalSaved = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalWithdrawn = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const currentBalance = totalSaved - totalWithdrawn;

  const handleCreateGoal = () => {
    if (goalName && goalTarget) {
      createGoalMutation.mutate({
        name: goalName,
        targetAmount: parseInt(goalTarget),
        currentAmount: 0
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(249,115,22,0.15),transparent_50%)]" />

      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/merchant')}
        className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 p-3 rounded-2xl shadow-lg transition-all hover:scale-105"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 animate-[slideDown_0.5s_ease-out]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
              Mon Argent
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-[slideUp_0.6s_ease-out]">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-lg text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Solde Actuel</p>
              <Wallet className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{currentBalance.toLocaleString()} F</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-lg text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Total Épargné</p>
              <PiggyBank className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{totalSaved.toLocaleString()} F</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 shadow-lg text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Objectifs Actifs</p>
              <Target className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{goals.length}</p>
          </div>
        </div>

        <div className="mb-6 animate-[slideUp_0.7s_ease-out]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Mes Objectifs</h2>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-amber-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nouveau
            </button>
          </div>

          {showAddGoal && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg mb-4 border-2 border-yellow-200">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Créer un objectif</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom de l'objectif (ex: Nouveau stock)"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-yellow-400"
                />
                <input
                  type="number"
                  placeholder="Montant cible (FCFA)"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-yellow-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateGoal}
                    disabled={!goalName || !goalTarget || createGoalMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                  >
                    Créer
                  </button>
                  <button
                    onClick={() => setShowAddGoal(false)}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun objectif</h3>
              <p className="text-lg text-gray-600">Crée ton premier objectif d'épargne</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal, index) => {
                const progress = ((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100;
                const isCompleted = progress >= 100;

                return (
                  <div
                    key={goal.id}
                    className="bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all"
                    style={{
                      animation: `slideUp 0.6s ease-out ${index * 0.1}s backwards`
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{goal.name}</h3>
                        <p className="text-sm text-gray-500">
                          {goal.currentAmount?.toLocaleString() || 0} / {goal.targetAmount?.toLocaleString() || 0} F
                        </p>
                      </div>
                      {isCompleted && (
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          Atteint !
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                              : 'bg-gradient-to-r from-yellow-500 to-amber-600'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm font-bold text-gray-600 mt-2">{progress.toFixed(0)}% atteint</p>
                    </div>

                    {goal.deadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Échéance: {format(new Date(goal.deadline), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="animate-[slideUp_0.8s_ease-out]">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Historique des Transactions</h2>

          {transactions.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune transaction</h3>
              <p className="text-lg text-gray-600">Tes transactions d'épargne apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-200 hover:border-yellow-300 transition-all"
                  style={{
                    animation: `slideUp 0.6s ease-out ${index * 0.05}s backwards`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${
                        transaction.type === 'deposit'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {transaction.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(transaction.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount?.toLocaleString()} F
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
