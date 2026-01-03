import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Download, Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface VoiceTransformationPanelProps {
  recordingId: string;
}

const VOICE_PERSONAS = [
  { id: "jsCxthxYrSOHRpm8IU1s", name: "Tantie Akissi", description: "Voix maternelle et chaleureuse" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Pro Bill", description: "Voix professionnelle et confiante" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Ambianceur Patrick", description: "Voix enjouée et motivante" },
];

export function VoiceTransformationPanel({ recordingId }: VoiceTransformationPanelProps) {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingTransformationId, setPlayingTransformationId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: recording, isLoading: loadingRecording } = trpc.voiceProduction.getRecording.useQuery({
    id: recordingId,
  });

  const { data: transformations, refetch: refetchTransformations } = trpc.voiceProduction.listTransformations.useQuery({
    recordingId,
  });

  const transformMutation = trpc.voiceProduction.transformVoice.useMutation({
    onSuccess: () => {
      toast.success("Transformation lancée avec succès");
      refetchTransformations();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hasPending = transformations?.some(
        (t) => t.status === "pending" || t.status === "processing"
      );
      if (hasPending) {
        refetchTransformations();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [transformations, refetchTransformations]);

  const handleTransform = async () => {
    if (!selectedVoiceId) {
      toast.error("Veuillez sélectionner une voix");
      return;
    }

    transformMutation.mutate({
      recordingId,
      targetVoiceId: selectedVoiceId,
      transformationType: "speech_to_speech",
    });
  };

  const playTransformation = (audioUrl: string, transformationId: string) => {
    if (audioRef.current) {
      if (playingTransformationId === transformationId && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setPlayingTransformationId(null);
      } else {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
        setPlayingTransformationId(transformationId);
      }
    }
  };

  const downloadTransformation = (audioUrl: string, voiceName: string) => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${voiceName}-${Date.now()}.mp3`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Terminé</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">En cours...</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case "failed":
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loadingRecording) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="text-center py-12 text-gray-500">
        Enregistrement introuvable
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enregistrement Original</CardTitle>
          <CardDescription>
            Durée: {recording.durationSeconds ? `${recording.durationSeconds}s` : "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recording.originalText && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{recording.originalText}</p>
            </div>
          )}
          <audio controls src={recording.audioUrl} className="w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Nouvelle Transformation
          </CardTitle>
          <CardDescription>
            Transformez l'enregistrement avec une voix SUTA différente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="voiceSelect">Sélectionner une voix</Label>
            <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
              <SelectTrigger id="voiceSelect" className="mt-2">
                <SelectValue placeholder="Choisir une voix..." />
              </SelectTrigger>
              <SelectContent>
                {VOICE_PERSONAS.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    <div>
                      <div className="font-medium">{persona.name}</div>
                      <div className="text-sm text-gray-500">{persona.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleTransform}
            disabled={!selectedVoiceId || transformMutation.isPending}
            className="w-full"
          >
            {transformMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Transformation en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Transformer la voix
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {transformations && transformations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transformations</CardTitle>
            <CardDescription>
              Historique des transformations de cet enregistrement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transformations.map((transformation) => {
                const persona = VOICE_PERSONAS.find((p) => p.id === transformation.targetVoiceId);
                return (
                  <div
                    key={transformation.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{persona?.name || "Voix inconnue"}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(transformation.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {getStatusBadge(transformation.status)}
                    </div>

                    {transformation.status === "completed" && transformation.outputAudioUrl && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            playTransformation(
                              transformation.outputAudioUrl!,
                              transformation.id
                            )
                          }
                        >
                          {playingTransformationId === transformation.id && isPlaying ? (
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
                          onClick={() =>
                            downloadTransformation(
                              transformation.outputAudioUrl!,
                              persona?.name || "transformation"
                            )
                          }
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    )}

                    {transformation.status === "failed" && transformation.errorMessage && (
                      <p className="text-sm text-red-600">{transformation.errorMessage}</p>
                    )}

                    {transformation.processingTimeMs && (
                      <p className="text-xs text-gray-500">
                        Temps de traitement: {(transformation.processingTimeMs / 1000).toFixed(2)}s
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          setPlayingTransformationId(null);
        }}
        className="hidden"
      />
    </div>
  );
}
