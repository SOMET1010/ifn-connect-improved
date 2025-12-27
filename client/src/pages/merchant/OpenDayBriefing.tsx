import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Sunrise, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSpeech } from '@/hooks/useSpeech';

/**
 * Page de briefing matinal pour l'ouverture de journée
 * Remplace le briefing automatique par une action explicite
 */
export default function OpenDayBriefing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [hasSpoken, setHasSpoken] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const { speak, stop } = useSpeech();

  // Récupérer le marchand
  const { data: merchant } = trpc.auth.myMerchant.useQuery();

  // Récupérer la comparaison des ventes
  const { data: comparison, isLoading } = (trpc.sales as any).yesterdayComparison.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant?.id }
  );

  // Mutation pour ouvrir la journée
  const openDay = trpc.dailySessions.open.useMutation({
    onSuccess: () => {
      setLocation('/merchant/dashboard');
    },
  });

  // Synthèse vocale automatique
  useEffect(() => {
    if (comparison && !hasSpoken && audioEnabled) {
      setHasSpoken(true);

      const yesterdayTotal = comparison.yesterday.total;
      const trend = comparison.comparison.trend;
      const percentChange = Math.abs(comparison.comparison.totalPercentChange);

      let message = `Bonjour ${user?.name || ''} ! Prêt à commencer une belle journée ? `;

      if (yesterdayTotal === 0) {
        message += `Hier, vous n'avez enregistré aucune vente. C'est une nouvelle journée, courage !`;
      } else {
        message += `Hier, vous avez réalisé ${yesterdayTotal} francs CFA de ventes. `;

        if (trend === 'up') {
          message += `C'est une hausse de ${percentChange}% par rapport à avant-hier. Excellent travail !`;
        } else if (trend === 'down') {
          message += `C'est une baisse de ${percentChange}% par rapport à avant-hier. Aujourd'hui est une nouvelle opportunité.`;
        } else {
          message += `Vos ventes sont stables. Continuez comme ça !`;
        }
      }

      message += ` Bonne journée et bonnes ventes !`;

      speak(message);
    }

    return () => {
      stop();
    };
  }, [comparison, hasSpoken, audioEnabled, speak, stop, user?.name]);

  const handleOpenDay = async () => {
    try {
      await openDay.mutateAsync({ openingNotes: notes || undefined });
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la journée:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
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

  const { yesterday, dayBefore, comparison: comp } = comparison;
  const trendIcon = comp.trend === 'up' ? TrendingUp : comp.trend === 'down' ? TrendingDown : Minus;
  const trendColor = comp.trend === 'up' ? 'text-green-600' : comp.trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 rounded-full">
              <Sunrise className="h-16 w-16 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold">Bonjour {user?.name || 'Marchand'} ! 👋</CardTitle>
          <CardDescription className="text-xl">Prêt à commencer une belle journée ?</CardDescription>
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
          {/* Section Comparaison */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                📊 Vos ventes d'hier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Hier</p>
                  <p className="text-3xl font-bold text-blue-600">{yesterday.total.toLocaleString()} FCFA</p>
                  <p className="text-sm text-muted-foreground">{yesterday.count} ventes</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avant-hier</p>
                  <p className="text-2xl font-bold text-gray-600">{dayBefore.total.toLocaleString()} FCFA</p>
                  <p className="text-sm text-muted-foreground">{dayBefore.count} ventes</p>
                </div>
              </div>

              {comp.totalDifference !== 0 && (
                <div className={`flex items-center justify-center gap-2 p-4 rounded-lg ${trendColor} bg-opacity-10`}>
                  {(() => {
                    const Icon = trendIcon;
                    return Icon ? <Icon className={`h-8 w-8 ${trendColor}`} /> : null;
                  })()}
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Math.abs(comp.totalPercentChange)}%</p>
                    <p className="text-sm">
                      {comp.trend === 'up' ? 'Hausse' : comp.trend === 'down' ? 'Baisse' : 'Stable'}
                    </p>
                  </div>
                </div>
              )}

              {yesterday.total === 0 && (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-lg font-semibold text-yellow-800">
                    Aucune vente hier. Aujourd'hui est une nouvelle opportunité ! 💪
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Objectif du jour */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                🎯 Mon objectif du jour
              </CardTitle>
              <CardDescription>
                Optionnel : Définissez votre objectif pour rester motivé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Vendre 50 000 FCFA aujourd'hui"
                className="min-h-[100px] text-lg"
              />
            </CardContent>
          </Card>

          {/* Bouton d'action */}
          <Button
            onClick={handleOpenDay}
            disabled={openDay.isPending}
            size="lg"
            className="w-full h-16 text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            {openDay.isPending ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Ouverture en cours...
              </>
            ) : (
              <>
                <Sunrise className="mr-2 h-6 w-6" />
                Commencer la journée
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
