import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Play, Pause, Trash2, Eye, Search, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VoiceLibraryProps {
  onRecordingSelected?: (recordingId: string) => void;
}

export function VoiceLibrary({ onRecordingSelected }: VoiceLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [recordingToDelete, setRecordingToDelete] = useState<string | null>(null);

  const { data: recordings, isLoading, refetch } = trpc.voiceProduction.listRecordings.useQuery();
  const deleteMutation = trpc.voiceProduction.deleteRecording.useMutation({
    onSuccess: () => {
      toast.success("Enregistrement supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const filteredRecordings = recordings?.filter((recording) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      recording.originalText?.toLowerCase().includes(query) ||
      recording.id.toLowerCase().includes(query)
    );
  });

  const handlePlayPause = (recordingId: string, audioUrl: string) => {
    const audioElement = document.getElementById(`audio-${recordingId}`) as HTMLAudioElement;
    if (audioElement) {
      if (playingRecordingId === recordingId) {
        audioElement.pause();
        setPlayingRecordingId(null);
      } else {
        if (playingRecordingId) {
          const previousAudio = document.getElementById(
            `audio-${playingRecordingId}`
          ) as HTMLAudioElement;
          if (previousAudio) {
            previousAudio.pause();
          }
        }
        audioElement.play();
        setPlayingRecordingId(recordingId);
      }
    }
  };

  const handleDelete = async () => {
    if (recordingToDelete) {
      await deleteMutation.mutateAsync({ id: recordingToDelete });
      setRecordingToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Terminé</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">En cours</Badge>;
      case "draft":
        return <Badge variant="outline">Brouillon</Badge>;
      case "failed":
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher dans les enregistrements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {!filteredRecordings || filteredRecordings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {searchQuery ? "Aucun enregistrement trouvé" : "Aucun enregistrement disponible"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecordings.map((recording) => (
            <Card key={recording.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Enregistrement du {new Date(recording.createdAt).toLocaleDateString()}
                    </CardTitle>
                    <CardDescription>
                      {recording.durationSeconds
                        ? `Durée: ${recording.durationSeconds}s`
                        : "Durée inconnue"}
                      {" • "}
                      {recording.fileSizeBytes
                        ? `Taille: ${(recording.fileSizeBytes / 1024).toFixed(2)} KB`
                        : ""}
                    </CardDescription>
                  </div>
                  {getStatusBadge(recording.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recording.originalText && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                      {recording.originalText}
                    </p>
                  </div>
                )}

                <audio
                  id={`audio-${recording.id}`}
                  src={recording.audioUrl}
                  onEnded={() => setPlayingRecordingId(null)}
                  className="w-full"
                  controls
                />

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlayPause(recording.id, recording.audioUrl)}
                  >
                    {playingRecordingId === recording.id ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Écouter
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRecordingSelected?.(recording.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Transformer
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRecordingToDelete(recording.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!recordingToDelete}
        onOpenChange={(open) => !open && setRecordingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet enregistrement ? Cette action est
              irréversible et supprimera également toutes les transformations associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
