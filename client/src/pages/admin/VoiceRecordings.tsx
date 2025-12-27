import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Pause, Trash2, Edit, Check, X, Volume2, FileAudio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "dioula", label: "Dioula" },
  { value: "baule", label: "Baoulé" },
  { value: "bete", label: "Bété" },
  { value: "senoufo", label: "Sénoufo" },
  { value: "malinke", label: "Malinké" },
];

export default function VoiceRecordingsAdmin() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // États du formulaire
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contextKey, setContextKey] = useState("");
  const [language, setLanguage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [speakerNotes, setSpeakerNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // États de lecture audio
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<number | null>(null);

  // Queries
  const { data: contexts = [] } = trpc.voiceRecordings.listContexts.useQuery();
  const { data: recordings = [], isLoading } = trpc.voiceRecordings.list.useQuery();
  const { data: stats } = trpc.voiceRecordings.stats.useQuery();

  // Mutations
  const createMutation = trpc.voiceRecordings.create.useMutation({
    onSuccess: () => {
      toast({
        title: "✅ Enregistrement créé",
        description: "Le fichier audio a été uploadé avec succès",
      });
      resetForm();
      utils.voiceRecordings.list.invalidate();
      utils.voiceRecordings.stats.invalidate();
    },
    onError: (error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = trpc.voiceRecordings.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "✅ Enregistrement supprimé",
        description: "L'enregistrement a été désactivé",
      });
      utils.voiceRecordings.list.invalidate();
      utils.voiceRecordings.stats.invalidate();
    },
    onError: (error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "❌ Fichier invalide",
          description: "Veuillez sélectionner un fichier audio (MP3, OGG, WAV, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "❌ Fichier trop volumineux",
          description: "La taille maximale est de 10 MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !contextKey || !language || !title) {
      toast({
        title: "❌ Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convertir le fichier en base64
      const buffer = await selectedFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      await createMutation.mutateAsync({
        contextKey,
        language,
        title,
        description: description || undefined,
        audioFile: {
          buffer: base64,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
        },
        speakerName: speakerName || undefined,
        speakerNotes: speakerNotes || undefined,
      });
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setContextKey("");
    setLanguage("");
    setTitle("");
    setDescription("");
    setSpeakerName("");
    setSpeakerNotes("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePlayPause = (recording: any) => {
    if (playingId === recording.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = recording.audioUrl;
        audioRef.current.play();
        setPlayingId(recording.id);
      }
    }
  };

  const handleDelete = (id: number) => {
    setRecordingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (recordingToDelete) {
      deleteMutation.mutate({ id: recordingToDelete });
      setDeleteDialogOpen(false);
      setRecordingToDelete(null);
    }
  };

  const getLanguageLabel = (lang: string) => {
    return LANGUAGES.find((l) => l.value === lang)?.label || lang;
  };

  const getContextLabel = (contextKey: string) => {
    return contexts.find((c) => c.value === contextKey)?.label || contextKey;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎤 Enregistrements Vocaux Natifs</h1>
        <p className="text-gray-600 mt-2">
          Gérez les traductions audio authentiques pour remplacer la synthèse vocale automatique
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#E07B39]">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">enregistrements actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Langues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.byLanguage).map(([lang, count]) => (
                  <div key={lang} className="flex justify-between text-sm">
                    <span className="text-gray-600">{getLanguageLabel(lang)}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Contextes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#2D9F4E]">
                {Object.keys(stats.byContext).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">contextes couverts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulaire d'upload */}
      <Card>
        <CardHeader>
          <CardTitle>📤 Uploader un nouvel enregistrement</CardTitle>
          <CardDescription>
            Ajoutez une traduction audio authentique enregistrée par un locuteur natif
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contexte */}
            <div className="space-y-2">
              <Label htmlFor="context">Contexte *</Label>
              <Select value={contextKey} onValueChange={setContextKey}>
                <SelectTrigger id="context">
                  <SelectValue placeholder="Sélectionner un contexte" />
                </SelectTrigger>
                <SelectContent>
                  {contexts.map((ctx) => (
                    <SelectItem key={ctx.value} value={ctx.value}>
                      {ctx.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Langue */}
            <div className="space-y-2">
              <Label htmlFor="language">Langue *</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bienvenue sur la plateforme"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle de l'enregistrement"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom du locuteur */}
            <div className="space-y-2">
              <Label htmlFor="speaker">Nom du locuteur</Label>
              <Input
                id="speaker"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                placeholder="Ex: Amadou Koné"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={speakerNotes}
                onChange={(e) => setSpeakerNotes(e.target.value)}
                placeholder="Ex: Prononciation standard"
              />
            </div>
          </div>

          {/* Fichier audio */}
          <div className="space-y-2">
            <Label htmlFor="audio">Fichier audio * (max 10 MB)</Label>
            <div className="flex gap-2">
              <Input
                id="audio"
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileAudio className="w-3 h-3" />
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !contextKey || !language || !title || isUploading}
              className="bg-[#E07B39] hover:bg-[#C66A2E]"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Upload en cours..." : "Uploader"}
            </Button>
            <Button onClick={resetForm} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des enregistrements */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Enregistrements existants</CardTitle>
          <CardDescription>
            {recordings.length} enregistrement{recordings.length > 1 ? "s" : ""} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun enregistrement pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Bouton play/pause */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlayPause(recording)}
                    className="shrink-0"
                  >
                    {playingId === recording.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{recording.title}</h3>
                      <Badge variant="outline">{getLanguageLabel(recording.language)}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {getContextLabel(recording.contextKey)}
                    </p>
                    {recording.speakerName && (
                      <p className="text-xs text-gray-500 mt-1">
                        Locuteur : {recording.speakerName}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(recording.id)}
                    className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio player caché */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        onError={() => {
          setPlayingId(null);
          toast({
            title: "❌ Erreur de lecture",
            description: "Impossible de lire le fichier audio",
            variant: "destructive",
          });
        }}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir désactiver cet enregistrement ? Il ne sera plus utilisé dans
              l'application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
