import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Share2, Download, Trophy, Calendar, Award } from 'lucide-react';
import { useState } from 'react';


export default function MyBadges() {
  const { data: badges, isLoading } = trpc.achievements.getMyBadges.useQuery();
  const generateBadgeImage = trpc.achievements.generateBadgeImage.useMutation();

  const [generatingBadgeId, setGeneratingBadgeId] = useState<number | null>(null);

  const handleShareWhatsApp = async (badgeId: number, badgeName: string) => {
    setGeneratingBadgeId(badgeId);
    try {
      const result = await generateBadgeImage.mutateAsync({ badgeId });
      
      // Télécharger l'image
      const link = document.createElement('a');
      link.href = result.image;
      link.download = result.filename;
      link.click();

      // Ouvrir WhatsApp avec un message
      const message = encodeURIComponent(
        `🎉 Je viens d'obtenir le badge "${badgeName}" sur IFN Connect ! 🏆\n\nRejoignez la plateforme d'inclusion financière numérique pour les marchands de Côte d'Ivoire.`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank');

      // Badge téléchargé avec succès
    } catch (error) {
      console.error('Erreur génération badge:', error);
      alert('Erreur : Impossible de générer l\'image du badge');
    } finally {
      setGeneratingBadgeId(null);
    }
  };

  const handleDownload = async (badgeId: number) => {
    setGeneratingBadgeId(badgeId);
    try {
      const result = await generateBadgeImage.mutateAsync({ badgeId });
      
      const link = document.createElement('a');
      link.href = result.image;
      link.download = result.filename;
      link.click();

      // Badge téléchargé avec succès
    } catch (error) {
      console.error('Erreur téléchargement badge:', error);
      alert('Erreur : Impossible de télécharger le badge');
    } finally {
      setGeneratingBadgeId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Chargement de vos badges...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-900">Mes Badges</h1>
        </div>
        <p className="text-gray-600">
          Vos récompenses et accomplissements sur IFN Connect
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{badges?.length || 0}</p>
                <p className="text-sm text-gray-600">Badges obtenus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {badges?.filter(b => b.scoreObtained >= 90).length || 0}
                </p>
                <p className="text-sm text-gray-600">Scores ≥ 90%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {badges?.filter(b => {
                    const earnedDate = new Date(b.earnedAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return earnedDate >= weekAgo;
                  }).length || 0}
                </p>
                <p className="text-sm text-gray-600">Cette semaine</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des badges */}
      {!badges || badges.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun badge pour le moment
              </h3>
              <p className="text-gray-600 mb-6">
                Terminez des cours avec succès pour gagner vos premiers badges !
              </p>
              <Button onClick={() => window.location.href = '/courses'}>
                Découvrir les cours
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <Card key={badge.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
                <div className="text-center">
                  <div className="text-6xl mb-3">{badge.badgeIcon}</div>
                  <CardTitle className="text-xl">{badge.badgeName}</CardTitle>
                  {badge.courseTitle && (
                    <CardDescription className="text-orange-100 mt-2">
                      {badge.courseTitle}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Score obtenu</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {badge.scoreObtained}%
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(badge.earnedAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleShareWhatsApp(badge.id, badge.badgeName)}
                      disabled={generatingBadgeId === badge.id}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {generatingBadgeId === badge.id ? 'Génération...' : 'WhatsApp'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(badge.id)}
                      disabled={generatingBadgeId === badge.id}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Badges à débloquer */}
      {badges && badges.length > 0 && badges.length < 10 && (
        <Card className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Continuez à apprendre !
            </CardTitle>
            <CardDescription>
              Il reste encore {10 - badges.length} badges à débloquer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-4">
              Terminez plus de cours avec un score élevé pour débloquer tous les badges :
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>🏆 <strong>Perfectionniste</strong> : Obtenez 100% à un quiz</li>
              <li>⭐ <strong>Apprenant Assidu</strong> : Terminez 5 cours avec succès</li>
              <li>📦 <strong>Maître du Stock</strong> : Score ≥ 80% au cours Gestion de Stock</li>
              <li>💰 <strong>Pro Mobile Money</strong> : Score ≥ 80% au cours Mobile Money</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
