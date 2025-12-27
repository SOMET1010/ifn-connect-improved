import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoTutorialCard } from "@/components/VideoTutorialCard";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  BookOpen, 
  ShoppingCart, 
  Package, 
  Store, 
  Shield,
  Loader2,
  Award
} from "lucide-react";

const categories = [
  { id: "caisse", labelFr: "Caisse", labelDioula: "Feereli", icon: ShoppingCart },
  { id: "stock", labelFr: "Stock", labelDioula: "Fɛɛrɛw", icon: Package },
  { id: "marche", labelFr: "Marché", labelDioula: "Sugu", icon: Store },
  { id: "protection_sociale", labelFr: "Protection sociale", labelDioula: "Kɛnɛya", icon: Shield },
  { id: "general", labelFr: "Général", labelDioula: "Bɛɛ", icon: BookOpen },
];

export default function Tutorials() {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("caisse");

  const { data: tutorialsData, isLoading } = trpc.tutorials.getAll.useQuery();
  const { data: progressData, refetch: refetchProgress } = trpc.tutorials.getProgress.useQuery();

  const watchedTutorials = progressData?.watchedTutorials || [];
  const totalWatched = progressData?.totalWatched || 0;

  // Compter le total de tutoriels
  const totalTutorials = tutorialsData 
    ? Object.values(tutorialsData).reduce((acc, tutorials) => acc + tutorials.length, 0)
    : 0;

  const handleTutorialWatched = () => {
    refetchProgress();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === "dioula" ? "📚 Kalanko" : "📚 Tutoriels"}
        </h1>
        <p className="text-muted-foreground">
          {language === "dioula" 
            ? "Vidéow surunw (30 sekɔnd) walasa ka baarakɛminɛn kɛcogo lon"
            : "Vidéos courtes (30 secondes) pour apprendre à utiliser l'application"}
        </p>
      </div>

      {/* Progression globale */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 to-white border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {totalWatched} / {totalTutorials}
              </h2>
              <p className="text-muted-foreground">
                {language === "dioula" 
                  ? "Vidéow lajɛra" 
                  : "Tutoriels regardés"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-orange-600">
              {totalTutorials > 0 ? Math.round((totalWatched / totalTutorials) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "dioula" ? "Ɲɛtaa" : "Progression"}
            </p>
          </div>
        </div>
      </Card>

      {/* Onglets par catégorie */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count = tutorialsData?.[cat.id]?.length || 0;
            const watched = tutorialsData?.[cat.id]?.filter(t => 
              watchedTutorials.includes(t.id)
            ).length || 0;
            
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="flex flex-col gap-1 py-3">
                <Icon className="w-5 h-5" />
                <span className="text-xs">
                  {language === "dioula" ? cat.labelDioula : cat.labelFr}
                </span>
                {count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {watched}/{count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id}>
            {tutorialsData?.[cat.id] && tutorialsData[cat.id].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutorialsData[cat.id].map((tutorial) => (
                  <VideoTutorialCard
                    key={tutorial.id}
                    tutorial={tutorial}
                    isWatched={watchedTutorials.includes(tutorial.id)}
                    onWatched={handleTutorialWatched}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {language === "dioula" 
                    ? "Vidéo si tɛ yan fɔlɔ" 
                    : "Aucun tutoriel disponible pour cette catégorie"}
                </p>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Bouton d'aide contextuel */}
      <div className="fixed bottom-24 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-orange-600 hover:bg-orange-700 text-white"
          title={language === "dioula" ? "Dɛmɛ" : "Aide"}
        >
          <span className="text-2xl">?</span>
        </Button>
      </div>
    </div>
  );
}
