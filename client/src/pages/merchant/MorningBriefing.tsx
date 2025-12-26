import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Sun, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSpeech } from '@/hooks/useSpeech';

export default function MorningBriefing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [hasSpoken, setHasSpoken] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { speak, stop } = useSpeech();

  // Récupérer le marchand
  const { data: merchant } = trpc.auth.myMerchant.useQuery();

  // Récupérer la comparaison des ventes
  const { data: comparison, isLoading } = (trpc.sales as any).yesterdayComparison.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant?.id }
  );

  // Marquer le briefing comme affiché
  const markShown = trpc.auth.markBriefingShown.useMutation();

  // Synthèse vocale automatique
  useEffect(() => {
    if (comparison && !hasSpoken && audioEnabled) {
      setHasSpoken(true);

      const yesterdayTotal = comparison.yesterday.total;
      const trend = comparison.comparison.trend;
      const percentChange = Math.abs(comparison.comparison.totalPercentChange);

      let message = `Bonjour ! Voici votre briefing matinal. `;

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
  }, [comparison, hasSpoken, audioEnabled, speak, stop]);

  const handleSkip = async () => {
    await markShown.mutateAsync();
    setLocation('/merchant/dashboard');
  };

  const handleContinue = async () => {
    await markShown.mutateAsync();
    setLocation('/merchant/dashboard');
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
  const trendBg = comp.trend === 'up' ? 'bg-green-50' : comp.trend === 'down' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sun className="h-8 w-8 text-orange-500 animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Bonjour {user?.name || 'Marchand'} ! 🌅
          </CardTitle>
          <CardDescription className="text-lg">
            Voici votre briefing matinal
          </CardDescription>

          {/* Bouton audio */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className="absolute top-4 right-4"
          >
            {audioEnabled ? (
              <Volume2 className="h-5 w-5 text-orange-600" />
            ) : (
              <VolumeX className="h-5 w-5 text-gray-400" />
            )}
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Ventes d'hier */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
            <div className="text-sm font-medium opacity-90 mb-1">Ventes d'hier</div>
            <div className="text-4xl font-bold mb-1">
              {yesterday.total.toLocaleString()} FCFA
            </div>
            <div className="text-sm opacity-90">
              {yesterday.count} vente{yesterday.count > 1 ? 's' : ''}
            </div>
          </div>

          {/* Comparaison */}
          <div className={`${trendBg} rounded-lg p-6 border-2 ${comp.trend === 'up' ? 'border-green-200' : comp.trend === 'down' ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-700">
                Comparaison avec avant-hier
              </div>
              <div className={`flex items-center gap-1 ${trendColor} font-bold`}>
                {trendIcon === TrendingUp && <TrendingUp className="h-5 w-5" />}
                {trendIcon === TrendingDown && <TrendingDown className="h-5 w-5" />}
                {trendIcon === Minus && <Minus className="h-5 w-5" />}
                <span className="text-lg">
                  {comp.totalPercentChange > 0 ? '+' : ''}{comp.totalPercentChange}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Avant-hier</div>
                <div className="font-semibold text-gray-900">
                  {dayBefore.total.toLocaleString()} FCFA
                </div>
                <div className="text-gray-500 text-xs">
                  {dayBefore.count} vente{dayBefore.count > 1 ? 's' : ''}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Différence</div>
                <div className={`font-semibold ${trendColor}`}>
                  {comp.totalDifference > 0 ? '+' : ''}{comp.totalDifference.toLocaleString()} FCFA
                </div>
                <div className="text-gray-500 text-xs">
                  {comp.countDifference > 0 ? '+' : ''}{comp.countDifference} vente{Math.abs(comp.countDifference) > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Message de motivation */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              {comp.trend === 'up' && '🎉 Excellent travail ! Vos ventes sont en hausse. Continuez sur cette lancée !'}
              {comp.trend === 'down' && '💪 Chaque jour est une nouvelle opportunité. Restez motivé !'}
              {comp.trend === 'stable' && '👍 Vos ventes sont stables. La régularité est la clé du succès !'}
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
            >
              Passer
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              onClick={handleContinue}
            >
              Commencer la journée
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
