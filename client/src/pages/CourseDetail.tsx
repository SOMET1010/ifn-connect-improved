import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Clock, 
  CheckCircle2,
  Download,
  ArrowLeft,
  Award,
  Play
} from 'lucide-react';
import { Link } from 'wouter';
// Toast simple sans hook externe
const showToast = (message: string) => {
  alert(message);
};

/**
 * Page de détail d'un cours
 * Lecteur vidéo + Suivi progression + Certificat
 */
export default function CourseDetail() {
  const [, params] = useRoute('/learning/:id');
  const courseId = params?.id ? parseInt(params.id) : 0;


  const [videoProgress, setVideoProgress] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Récupérer le cours
  const { data: course, isLoading } = trpc.courses.getById.useQuery({ id: courseId });

  // Récupérer la progression
  const { data: progress, refetch: refetchProgress } = trpc.courses.getProgress.useQuery({ courseId });

  // Mutation pour mettre à jour la progression
  const updateProgressMutation = trpc.courses.updateProgress.useMutation({
    onSuccess: () => {
      refetchProgress();
    },
  });

  // Mutation pour marquer comme terminé
  const markCompleteMutation = trpc.courses.markComplete.useMutation({
    onSuccess: () => {
      refetchProgress();
      showToast('🎉 Félicitations ! Vous avez terminé ce cours avec succès.');
    },
  });

  // Mutation pour générer le certificat
  const generateCertificateMutation = trpc.courses.generateCertificate.useMutation({
    onSuccess: (data) => {
      // Télécharger le PDF
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${data.pdf}`;
      link.download = data.filename;
      link.click();

      showToast('📜 Certificat généré ! Votre certificat a été téléchargé.');
    },
    onError: () => {
      showToast('Erreur : Impossible de générer le certificat.');
    },
  });

  /**
   * Extraire l'ID vidéo YouTube ou Vimeo
   */
  const getVideoEmbedUrl = (url: string) => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // URL directe
    return url;
  };

  /**
   * Simuler le suivi de progression vidéo
   * (Dans une vraie implémentation, utiliser l'API YouTube/Vimeo)
   */
  useEffect(() => {
    if (!isVideoPlaying) return;

    const interval = setInterval(() => {
      setVideoProgress((prev) => {
        const newProgress = Math.min(prev + 1, 100);
        
        // Mettre à jour la progression toutes les 10%
        if (newProgress % 10 === 0 && newProgress !== prev) {
          updateProgressMutation.mutate({
            courseId,
            progress: newProgress,
          });
        }

        return newProgress;
      });
    }, 1000); // Simuler 1% par seconde

    return () => clearInterval(interval);
  }, [isVideoPlaying, courseId]);

  /**
   * Marquer comme terminé
   */
  const handleMarkComplete = () => {
    markCompleteMutation.mutate({ courseId });
  };

  /**
   * Télécharger le certificat
   */
  const handleDownloadCertificate = () => {
    generateCertificateMutation.mutate({ courseId });
  };

  /**
   * Traduire la catégorie
   */
  const translateCategory = (cat: string) => {
    const translations: Record<string, string> = {
      gestion_stock: 'Gestion de Stock',
      paiements_mobiles: 'Paiements Mobiles',
      protection_sociale: 'Protection Sociale',
      marketing: 'Marketing',
    };
    return translations[cat] || cat;
  };

  /**
   * Traduire le niveau
   */
  const translateLevel = (lvl: string) => {
    const translations: Record<string, string> = {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
    };
    return translations[lvl] || lvl;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Chargement...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <div className="text-2xl font-semibold text-gray-700 mb-4">Cours introuvable</div>
          <Link href="/learning">
            <Button>Retour aux cours</Button>
          </Link>
        </div>
      </div>
    );
  }

  const embedUrl = getVideoEmbedUrl(course.videoUrl || '');
  const currentProgress = progress?.progress || 0;
  const isCompleted = progress?.completed || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/learning">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour aux cours
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale - Vidéo */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Lecteur vidéo */}
            <Card className="overflow-hidden">
              {embedUrl ? (
                <div className="relative" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsVideoPlaying(true)}
                  />
                </div>
              ) : (
                <div className="h-96 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-xl">Aucune vidéo disponible</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Informations du cours */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-indigo-600">
                  {translateCategory(course.category)}
                </span>
                <span className="text-sm text-gray-600">
                  {translateLevel(course.level)}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>

              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <Clock className="w-5 h-5" />
                <span>{course.duration} minutes</span>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {course.description}
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar - Progression */}
          <div className="space-y-6">
            
            {/* Progression */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Votre Progression
              </h2>

              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Avancement</span>
                  <span className="font-semibold text-indigo-600">{currentProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
              </div>

              {/* Badge Terminé */}
              {isCompleted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="font-semibold text-green-900">Cours terminé !</div>
                      <div className="text-sm text-green-700">Félicitations pour votre réussite</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {!isCompleted && (
                  <Button 
                    className="w-full"
                    onClick={handleMarkComplete}
                    disabled={markCompleteMutation.isPending}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {markCompleteMutation.isPending ? 'Enregistrement...' : 'Marquer comme terminé'}
                  </Button>
                )}

                {isCompleted && (
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={handleDownloadCertificate}
                    disabled={generateCertificateMutation.isPending}
                  >
                    {generateCertificateMutation.isPending ? (
                      <>
                        <Download className="w-5 h-5 mr-2 animate-bounce" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Award className="w-5 h-5 mr-2" />
                        Télécharger le certificat
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>

            {/* Informations supplémentaires */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Ce que vous allez apprendre
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Concepts fondamentaux et pratiques</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Exemples concrets et cas d'usage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Bonnes pratiques du secteur</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Certificat de complétion</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
