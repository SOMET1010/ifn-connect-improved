import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Check, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

interface VideoTutorialCardProps {
  tutorial: {
    id: number;
    title: string;
    titleDioula: string | null;
    description: string;
    descriptionDioula: string | null;
    videoUrl: string;
    thumbnailUrl: string | null;
    duration: number;
    category: string;
  };
  isWatched?: boolean;
  onWatched?: () => void;
}

export function VideoTutorialCard({ tutorial, isWatched = false, onWatched }: VideoTutorialCardProps) {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [localWatched, setLocalWatched] = useState(isWatched);

  const markAsWatchedMutation = trpc.tutorials.markAsWatched.useMutation({
    onSuccess: () => {
      setLocalWatched(true);
      onWatched?.();
      toast.success(
        language === "dioula" ? "✅ I ye a lajɛ" : "✅ Tutoriel regardé",
        {
          description: language === "dioula" 
            ? "I ye kalanko in lajɛ. Barika!" 
            : "Vous avez regardé ce tutoriel. Bravo !",
        }
      );
    },
  });

  const title = language === "dioula" && tutorial.titleDioula ? tutorial.titleDioula : tutorial.title;
  const description = language === "dioula" && tutorial.descriptionDioula ? tutorial.descriptionDioula : tutorial.description;

  const handlePlay = () => {
    setIsPlaying(true);
    // Marquer automatiquement comme regardé après 5 secondes
    setTimeout(() => {
      if (!localWatched) {
        markAsWatchedMutation.mutate({ tutorialId: tutorial.id });
      }
    }, 5000);
  };

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  // Extraire l'ID YouTube de l'URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(tutorial.videoUrl);
  const embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1` : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Lecteur vidéo ou miniature */}
      <div className="relative aspect-video bg-gray-900">
        {isPlaying && embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {tutorial.thumbnailUrl ? (
              <img
                src={tutorial.thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
                <Play className="w-16 h-16 text-white opacity-50" />
              </div>
            )}
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-orange-600 ml-1" />
              </div>
            </button>
          </>
        )}
        
        {/* Badge durée */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(tutorial.duration)}
        </div>

        {/* Badge "Regardé" */}
        {localWatched && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-600 text-white">
              <Check className="w-3 h-3 mr-1" />
              {language === "dioula" ? "Lajɛra" : "Regardé"}
            </Badge>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>

        {!localWatched && !isPlaying && (
          <Button
            onClick={handlePlay}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            {language === "dioula" ? "Ka daminɛ" : "Regarder"}
          </Button>
        )}
      </div>
    </Card>
  );
}
