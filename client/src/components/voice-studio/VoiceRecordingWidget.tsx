import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause, Upload, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface VoiceRecordingWidgetProps {
  onRecordingCreated?: (recordingId: string) => void;
}

export function VoiceRecordingWidget({ onRecordingCreated }: VoiceRecordingWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [originalText, setOriginalText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const uploadMutation = trpc.voiceProduction.uploadRecording.useMutation();

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const uploadRecording = async () => {
    if (!audioBlob) {
      toast.error("Aucun enregistrement à uploader");
      return;
    }

    try {
      const fileName = `recording-${Date.now()}.webm`;
      const fileType = "audio/webm";

      const { uploadUrl, recording } = await uploadMutation.mutateAsync({
        fileName,
        fileType,
        originalText: originalText || undefined,
        durationSeconds: recordingTime,
        fileSizeBytes: audioBlob.size,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        body: audioBlob,
        headers: {
          "Content-Type": fileType,
        },
      });

      toast.success("Enregistrement uploadé avec succès");
      onRecordingCreated?.(recording.id);
      clearRecording();
      setOriginalText("");
    } catch (error) {
      console.error("Error uploading recording:", error);
      toast.error("Erreur lors de l'upload de l'enregistrement");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="originalText">Texte du script (optionnel)</Label>
            <Textarea
              id="originalText"
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Entrez le texte que vous allez enregistrer..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="text-4xl font-mono font-bold text-gray-700">
              {formatTime(recordingTime)}
            </div>

            <div className="flex items-center gap-4">
              {!isRecording && !audioBlob && (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="rounded-full w-16 h-16"
                >
                  <Mic className="w-6 h-6" />
                </Button>
              )}

              {isRecording && (
                <>
                  {!isPaused ? (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={pauseRecording}
                      className="rounded-full w-16 h-16"
                    >
                      <Pause className="w-6 h-6" />
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={resumeRecording}
                      className="rounded-full w-16 h-16"
                    >
                      <Play className="w-6 h-6" />
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="rounded-full w-16 h-16"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                </>
              )}

              {audioBlob && !isRecording && (
                <>
                  <Button
                    size="lg"
                    variant={isPlaying ? "outline" : "default"}
                    onClick={isPlaying ? pauseAudio : playAudio}
                    className="rounded-full w-16 h-16"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={clearRecording}
                    className="rounded-full w-16 h-16"
                  >
                    <Trash2 className="w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={uploadRecording}
                    disabled={uploadMutation.isPending}
                    className="rounded-full w-16 h-16"
                  >
                    <Upload className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>

            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}

            <div className="text-sm text-gray-500">
              {isRecording && !isPaused && "Enregistrement en cours..."}
              {isRecording && isPaused && "Enregistrement en pause"}
              {!isRecording && !audioBlob && "Cliquez sur le microphone pour commencer"}
              {!isRecording && audioBlob && "Écoutez et uploadez votre enregistrement"}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
