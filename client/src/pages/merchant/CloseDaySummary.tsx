import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Moon, Volume2, VolumeX, Loader2, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSpeech } from '@/hooks/useSpeech';

/**
 * Page de bilan de journée pour la fermeture
 * Affiche les statistiques du jour et permet de fermer la journée
 */
export default function CloseDaySummary() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [hasSpoken, setHasSpoken] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const { speak, stop } = useSpeech();

  // Récupérer le marchand
  const { data: merchant } = trpc.auth.myMerchant.useQuery();

  // Récupérer la comparaison des ventes (aujourd'hui vs hier)
  const { data: comparison, isLoading } = (trpc.sales as any).yesterdayComparison.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant?.id }
  );

  // Récupérer le score SUTA
  const { data: score } = trpc.scores.getScore.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant?.id }
  );

  // Mutation pour fermer la journée
  const closeDay = trpc.dailySessions.close.useMutation({
    onSuccess: () => {
      setLocation('/merchant/dashboard');
    },
  });

  // Synthèse vocale automatique
  useEffect(() => {
    if (comparison && !hasSpoken && audioEnabled) {
      setHasSpoken(true);

      const todayTotal = comparison.yesterday.total; // "yesterday" = aujourd'hui dans la comparaison
      const trend = comparison.comparison.trend;
      const percentChange = Math.abs(comparison.comparison.totalPercentChange);

      let message = `Bravo ${user?.name || ''} ! Voici ton bilan de la journée. `;

      if (todayTotal === 0) {
        message += `Aujourd'hui, vous n'avez enregistré aucune vente. Demain sera meilleur !`;
      } else {
        message += `Aujourd'hui, vous avez réalisé ${todayTotal} francs CFA de ventes. `;

        if (trend === 'up') {
          message += `C'est une hausse de ${percentChange}% par rapport à hier. Félicitations !`;
        } else if (trend === 'down') {
          message += `C'est une baisse de ${percentChange}% par rapport à hier. Continuez vos efforts.`;
        } else {
          message += `Vos ventes sont stables. Bon travail !`;
        }
      }

      if (score && score.totalScore >= 70) {
        message += ` Votre score SUTA est de ${score.totalScore} sur 100. Vous êtes éligible au micro-crédit !`;
      }

      message += ` Reposez-vous bien et à demain !`;

      speak(message);
    }

    return () => {
      stop();
    };
  }, [comparison, hasSpoken, audioEnabled, speak, stop, user?.name, score]);

  const handleCloseDay = async () => {
    try {
      await closeDay.mutateAsync({ closingNotes: notes || undefined });
    } catch (error) {
      console.error('Erreur lors de la fermeture de la journée:', error);
    }
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      stop();
    }
    setAudioEnabled(!audioEnabled);
  };

  if (isLoading || !comparison) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { yesterday: today, dayBefore: yesterday, comparison: comp } = comparison;
  const trendIcon = comp.trend === 'up' ? TrendingUp : comp.trend === 'down' ? TrendingDown : Minus;
  const trendColor = comp.trend === 'up' ? 'text-green-600' : comp.trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-full">
              <Moon className="h-16 w-16 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold">Bravo {user?.name || 'Marchand'} ! 🎉</CardTitle>
          <CardDescription className="text-xl">Voici ton bilan de la journée</CardDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className="absolute top-4 right-4"
          >
            {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Section Ventes du jour */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                💰 Ventes du jour
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                <p className="text-5xl font-bold text-blue-600">{today.total.toLocaleString()} FCFA</p>
                <p className="text-lg text-muted-foreground mt-2">{today.count} transactions</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-blue-600">{today.total.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-muted-foreground">Hier</p>
                  <p className="text-2xl font-bold text-gray-600">{yesterday.total.toLocaleString()}</p>
                </div>
              </div>

              {comp.totalDifference !== 0 && (
                <div className={`flex items-center justify-center gap-2 p-4 rounded-lg ${trendColor} bg-white`}>
                  {(() => {
                    const Icon = trendIcon;
                    return Icon ? <Icon className={`h-8 w-8 ${trendColor}`} /> : null;
                  })()}
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Math.abs(comp.totalPercentChange)}%</p>
                    <p className="text-sm">
                      {comp.trend === 'up' ? 'Hausse par rapport à hier' : comp.trend === 'down' ? 'Baisse par rapport à hier' : 'Stable'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Score SUTA */}
          {score && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  Score SUTA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-4xl font-bold text-green-600">{score.totalScore}/100</p>
                  {score.totalScore >= 70 && (
                    <p className="text-lg text-green-700 mt-2 font-semibold">
                      ✅ Éligible au micro-crédit !
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section Réflexion */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                💭 Ce que j'ai appris aujourd'hui
              </CardTitle>
              <CardDescription>
                Optionnel : Notez vos réflexions pour progresser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Les tomates se vendent mieux le matin"
                className="min-h-[100px] text-lg"
              />
            </CardContent>
          </Card>

          {/* Bouton d'action */}
          <Button
            onClick={handleCloseDay}
            disabled={closeDay.isPending}
            size="lg"
            className="w-full h-16 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {closeDay.isPending ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Fermeture en cours...
              </>
            ) : (
              <>
                <Moon className="mr-2 h-6 w-6" />
                Terminer la journée
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
