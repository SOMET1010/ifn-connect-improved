import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Clock, 
  Play,
  CheckCircle2,
  Filter,
  TrendingUp
} from 'lucide-react';
import { Link } from 'wouter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Page E-Learning
 * Liste des cours disponibles avec filtres
 */
export default function Learning() {
  const [category, setCategory] = useState<string>('');
  const [level, setLevel] = useState<string>('');

  // Récupérer tous les cours
  const { data: courses, isLoading } = trpc.courses.getAll.useQuery({
    category: category || undefined,
    level: level || undefined,
  });

  // Récupérer la progression de l'utilisateur
  const { data: myProgress } = trpc.courses.getMyProgress.useQuery();

  /**
   * Obtenir la progression pour un cours
   */
  const getProgressForCourse = (courseId: number) => {
    return myProgress?.find((p) => p.courseId === courseId);
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

  /**
   * Obtenir la couleur de la catégorie
   */
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      gestion_stock: 'from-purple-500 to-pink-600',
      paiements_mobiles: 'from-green-500 to-emerald-600',
      protection_sociale: 'from-orange-500 to-red-600',
      marketing: 'from-blue-500 to-cyan-600',
    };
    return colors[cat] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <GraduationCap className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Centre de Formation
          </h1>
          <p className="text-2xl md:text-3xl mb-8 max-w-4xl mx-auto">
            Développez vos compétences avec nos modules e-learning accessibles 24/7
          </p>
          <div className="flex items-center justify-center gap-4 text-xl">
            <TrendingUp className="w-8 h-8" />
            <span className="font-semibold">Apprenez à votre rythme, progressez en continu</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        
        {/* Filtres */}
        <Card className="p-6 mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Filtrer les cours</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre Catégorie */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                <SelectItem value="gestion_stock">Gestion de Stock</SelectItem>
                <SelectItem value="paiements_mobiles">Paiements Mobiles</SelectItem>
                <SelectItem value="protection_sociale">Protection Sociale</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre Niveau */}
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les niveaux</SelectItem>
                <SelectItem value="beginner">Débutant</SelectItem>
                <SelectItem value="intermediate">Intermédiaire</SelectItem>
                <SelectItem value="advanced">Avancé</SelectItem>
              </SelectContent>
            </Select>

            {/* Bouton Reset */}
            <Button
              variant="outline"
              onClick={() => {
                setCategory('');
                setLevel('');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </Card>

        {/* Liste des Cours */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-2xl font-semibold text-gray-700">Chargement...</div>
          </div>
        ) : !courses || courses.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-2xl font-semibold text-gray-700">Aucun cours disponible</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const progress = getProgressForCourse(course.id);
              const isCompleted = progress?.completed || false;
              const progressPercent = progress?.progress || 0;

              return (
                <Card key={course.id} className="overflow-hidden hover:shadow-2xl transition-shadow">
                  {/* Thumbnail */}
                  <div className={`h-48 bg-gradient-to-br ${getCategoryColor(course.category)} flex items-center justify-center relative`}>
                    {course.thumbnailUrl ? (
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <GraduationCap className="w-20 h-20 text-white" />
                    )}
                    
                    {/* Badge Terminé */}
                    {isCompleted && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-semibold">Terminé</span>
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="p-6">
                    {/* Catégorie et Niveau */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-indigo-600">
                        {translateCategory(course.category)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {translateLevel(course.level)}
                      </span>
                    </div>

                    {/* Titre */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Durée */}
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{course.duration} minutes</span>
                    </div>

                    {/* Barre de progression */}
                    {progressPercent > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Progression</span>
                          <span className="font-semibold">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Bouton CTA */}
                    <Link href={`/learning/${course.id}`}>
                      <Button className="w-full group">
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Revoir le cours
                          </>
                        ) : progressPercent > 0 ? (
                          <>
                            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Continuer
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Commencer
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
