import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Swords,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Challenges() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Récupérer les défis
  const { data: receivedChallenges, refetch: refetchReceived } = trpc.challenges.getReceived.useQuery();
  const { data: sentChallenges, refetch: refetchSent } = trpc.challenges.getSent.useQuery();
  const { data: history } = trpc.challenges.getHistory.useQuery();
  
  // Filtrer les défis terminés
  const completedChallenges = history?.filter((c) => c.status === 'completed');

  // Récupérer les cours disponibles pour les défis
  const { data: courses } = trpc.courses.getAll.useQuery();

  // Mutations
  const createChallengeMutation = trpc.challenges.create.useMutation({
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      setSelectedMerchantId(null);
      setSelectedCourseId(null);
      refetchSent();
      alert('Défi envoyé avec succès !');
    },
  });

  const acceptChallengeMutation = trpc.challenges.accept.useMutation({
    onSuccess: () => {
      refetchReceived();
      alert('Défi accepté ! Rendez-vous sur la page du cours pour commencer.');
    },
  });

  const declineChallengeMutation = trpc.challenges.decline.useMutation({
    onSuccess: () => {
      refetchReceived();
      alert('Défi refusé.');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      accepted: { label: 'Accepté', color: 'bg-blue-100 text-blue-700 border-blue-300' },
      declined: { label: 'Refusé', color: 'bg-red-100 text-red-700 border-red-300' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-700 border-green-300' },
    };
    const info = statusMap[status] || statusMap.pending;
    return (
      <Badge className={`${info.color} border-2`} variant="outline">
        {info.label}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <Swords className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Défis entre marchands</h1>
          </div>
          
          {/* Bouton créer un défi */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Lancer un défi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lancer un défi</DialogTitle>
                <DialogDescription>
                  Défiez un autre marchand sur un quiz de votre choix
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="merchant">Marchand à défier</Label>
                  <Input
                    id="merchant"
                    type="number"
                    placeholder="ID du marchand"
                    value={selectedMerchantId || ''}
                    onChange={(e) => setSelectedMerchantId(parseInt(e.target.value) || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entrez l'ID du marchand que vous souhaitez défier
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Quiz</Label>
                  <Select
                    value={selectedCourseId?.toString()}
                    onValueChange={(value) => setSelectedCourseId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un quiz" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedMerchantId || !selectedCourseId}
                  onClick={() => {
                    if (selectedMerchantId && selectedCourseId) {
                      createChallengeMutation.mutate({
                        challengedId: selectedMerchantId,
                        courseId: selectedCourseId,
                      });
                    }
                  }}
                >
                  Envoyer le défi
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-gray-600">Défiez vos amis et comparez vos scores !</p>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="received" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="received" className="gap-2">
            <Clock className="h-4 w-4" />
            Reçus ({receivedChallenges?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Envoyés ({sentChallenges?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <Trophy className="h-4 w-4" />
            Historique ({completedChallenges?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Défis reçus */}
        <TabsContent value="received" className="space-y-4">
          {!receivedChallenges || receivedChallenges.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun défi reçu pour le moment</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            receivedChallenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-indigo-600" />
                        Défi de {challenge.challengerName}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Quiz : {challenge.courseTitle}
                      </CardDescription>
                    </div>
                    {getStatusBadge(challenge.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {challenge.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          className="gap-2"
                          onClick={() => acceptChallengeMutation.mutate({ challengeId: challenge.id })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Accepter
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => declineChallengeMutation.mutate({ challengeId: challenge.id })}
                        >
                          <XCircle className="h-4 w-4" />
                          Refuser
                        </Button>
                      </>
                    )}
                    {challenge.status === 'accepted' && (
                      <p className="text-sm text-muted-foreground">
                        Rendez-vous sur la page du cours pour passer le quiz !
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Défis envoyés */}
        <TabsContent value="sent" className="space-y-4">
          {!sentChallenges || sentChallenges.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Vous n'avez envoyé aucun défi</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            sentChallenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-indigo-600" />
                        Défi à {challenge.challengedName}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Quiz : {challenge.courseTitle}
                      </CardDescription>
                    </div>
                    {getStatusBadge(challenge.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Envoyé le {new Date(challenge.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Historique */}
        <TabsContent value="completed" className="space-y-4">
          {!completedChallenges || completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun défi terminé</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            completedChallenges.map((challenge: any) => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        {challenge.challengerName} vs {challenge.challengedName}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Quiz : {challenge.courseTitle}
                      </CardDescription>
                    </div>
                    {getStatusBadge(challenge.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{challenge.challengerName}</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {challenge.challengerScore !== null ? `${challenge.challengerScore}%` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{challenge.challengedName}</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {challenge.challengedScore !== null ? `${challenge.challengedScore}%` : '-'}
                      </p>
                    </div>
                  </div>
                  {challenge.challengerScore !== null && challenge.challengedScore !== null && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-center">
                        {challenge.challengerScore > challenge.challengedScore
                          ? `🏆 ${challenge.challengerName} a gagné !`
                          : challenge.challengedScore > challenge.challengerScore
                          ? `🏆 ${challenge.challengedName} a gagné !`
                          : '🤝 Égalité !'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
