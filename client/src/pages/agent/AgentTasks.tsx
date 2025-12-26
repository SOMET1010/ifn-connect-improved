import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  UserX, 
  MapPin, 
  Phone, 
  Target,
  Filter,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

type TaskType = 'inactive_merchant' | 'incomplete_enrollment' | 'expiring_coverage' | 'weekly_goal';
type Priority = 'high' | 'medium' | 'low';

interface Task {
  id: string;
  type: TaskType;
  priority: Priority;
  title: string;
  description: string;
  merchantId?: number;
  merchantNumber?: string;
  location?: string;
  progress?: number;
  createdAt: Date;
}

/**
 * Page des tâches du jour pour les agents terrain
 * Affiche les marchands à contacter, enrôlements à finaliser, etc.
 */
export default function AgentTasks() {
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');

  // Récupérer les tâches
  const { data: tasks = [], isLoading, refetch } = trpc.agent.getTasks.useQuery();

  // Filtrer les tâches
  const filteredTasks = tasks.filter((task: Task) => {
    if (filterType !== 'all' && task.type !== filterType) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  // Statistiques
  const stats = {
    total: tasks.length,
    high: tasks.filter((t: Task) => t.priority === 'high').length,
    medium: tasks.filter((t: Task) => t.priority === 'medium').length,
    low: tasks.filter((t: Task) => t.priority === 'low').length,
  };

  // Marquer une tâche comme terminée
  const handleMarkAsDone = (taskId: string) => {
    toast.success('Tâche marquée comme terminée');
    // TODO: Implémenter la mutation pour marquer comme fait
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-gray-700">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-2">
          <Target className="w-10 h-10 text-primary" />
          Tâches du Jour
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Vos actions prioritaires pour aujourd'hui
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Tâches totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600">{stats.high}</div>
            <div className="text-sm text-muted-foreground">Priorité haute</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-600">{stats.medium}</div>
            <div className="text-sm text-muted-foreground">Priorité moyenne</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{stats.low}</div>
            <div className="text-sm text-muted-foreground">Priorité basse</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Filtre par type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Type de tâche</label>
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Toutes
                </Button>
                <Button
                  variant={filterType === 'inactive_merchant' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('inactive_merchant')}
                >
                  Inactifs
                </Button>
                <Button
                  variant={filterType === 'incomplete_enrollment' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('incomplete_enrollment')}
                >
                  Incomplets
                </Button>
                <Button
                  variant={filterType === 'expiring_coverage' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('expiring_coverage')}
                >
                  Renouvellements
                </Button>
              </div>
            </div>

            {/* Filtre par priorité */}
            <div>
              <label className="text-sm font-medium mb-2 block">Priorité</label>
              <div className="flex gap-2">
                <Button
                  variant={filterPriority === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPriority('all')}
                >
                  Toutes
                </Button>
                <Button
                  variant={filterPriority === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPriority('high')}
                >
                  Haute
                </Button>
                <Button
                  variant={filterPriority === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPriority('medium')}
                >
                  Moyenne
                </Button>
                <Button
                  variant={filterPriority === 'low' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPriority('low')}
                >
                  Basse
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des tâches */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Aucune tâche</h3>
              <p className="text-muted-foreground">
                {filterType !== 'all' || filterPriority !== 'all'
                  ? 'Aucune tâche ne correspond aux filtres sélectionnés'
                  : 'Toutes vos tâches sont terminées ! 🎉'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task: Task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTaskIcon(task.type)}
                      <CardTitle className="text-xl">{task.title}</CardTitle>
                      {getPriorityBadge(task.priority)}
                      {getTypeBadge(task.type)}
                    </div>
                    <CardDescription className="text-base">{task.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Informations du marchand */}
                {task.merchantNumber && (
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{task.merchantNumber}</Badge>
                    </div>
                    {task.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {task.location}
                      </div>
                    )}
                  </div>
                )}

                {/* Barre de progression pour l'objectif hebdomadaire */}
                {task.type === 'weekly_goal' && task.progress !== undefined && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progression</span>
                      <span className="text-sm font-bold text-primary">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-primary rounded-full h-3 transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {task.type !== 'weekly_goal' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleMarkAsDone(task.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Marquer comme fait
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler
                      </Button>
                    </>
                  )}
                  {task.type === 'weekly_goal' && (
                    <Button variant="outline" size="sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Voir les détails
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Obtenir l'icône correspondant au type de tâche
 */
function getTaskIcon(type: TaskType) {
  switch (type) {
    case 'inactive_merchant':
      return <UserX className="w-5 h-5 text-red-500" />;
    case 'incomplete_enrollment':
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    case 'expiring_coverage':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'weekly_goal':
      return <Target className="w-5 h-5 text-green-500" />;
  }
}

/**
 * Obtenir le badge de priorité
 */
function getPriorityBadge(priority: Priority) {
  const colors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  const labels = {
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
  };

  return (
    <Badge variant="outline" className={colors[priority]}>
      {labels[priority]}
    </Badge>
  );
}

/**
 * Obtenir le badge de type
 */
function getTypeBadge(type: TaskType) {
  const labels = {
    inactive_merchant: 'Inactif',
    incomplete_enrollment: 'Incomplet',
    expiring_coverage: 'Renouvellement',
    weekly_goal: 'Objectif',
  };

  return <Badge variant="secondary">{labels[type]}</Badge>;
}
