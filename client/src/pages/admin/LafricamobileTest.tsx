import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle, Volume2, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Page de test pour l'intégration Lafricamobile
 * Permet de tester la traduction et la synthèse vocale
 */
export default function LafricamobileTest() {
  const { toast } = useToast();
  
  // États
  const [textFr, setTextFr] = useState("Bienvenue sur la plateforme IFN Connect");
  const [language, setLanguage] = useState("dioula");
  const [translatedText, setTranslatedText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  // Queries
  const { data: hasCredentials } = trpc.lafricamobile.hasCredentials.useQuery();
  const { data: supportedLanguages } = trpc.lafricamobile.supportedLanguages.useQuery();

  // Mutations
  const translateMutation = trpc.lafricamobile.translate.useMutation({
    onSuccess: (data) => {
      setTranslatedText(data.translatedText);
      toast({
        title: "✅ Traduction réussie",
        description: `"${data.originalText}" → "${data.translatedText}"`,
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erreur de traduction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const synthesizeMutation = trpc.lafricamobile.synthesize.useMutation({
    onSuccess: (data) => {
      setAudioUrl(data.audioUrl);
      toast({
        title: "✅ Synthèse vocale réussie",
        description: "Audio généré avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erreur de synthèse vocale",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const translateAndSynthesizeMutation = trpc.lafricamobile.translateAndSynthesize.useMutation({
    onSuccess: (data) => {
      setTranslatedText(data.translatedText);
      setAudioUrl(data.audioUrl);
      toast({
        title: "✅ Traduction + Synthèse réussie",
        description: `"${data.originalText}" → "${data.translatedText}"`,
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleTranslate = () => {
    if (!textFr.trim()) {
      toast({
        title: "⚠️ Attention",
        description: "Veuillez entrer un texte à traduire",
        variant: "destructive",
      });
      return;
    }

    translateMutation.mutate({ text: textFr, toLang: language });
  };

  const handleSynthesize = () => {
    const text = translatedText || textFr;
    if (!text.trim()) {
      toast({
        title: "⚠️ Attention",
        description: "Veuillez entrer un texte à synthétiser",
        variant: "destructive",
      });
      return;
    }

    synthesizeMutation.mutate({ text, toLang: language });
  };

  const handleTranslateAndSynthesize = () => {
    if (!textFr.trim()) {
      toast({
        title: "⚠️ Attention",
        description: "Veuillez entrer un texte",
        variant: "destructive",
      });
      return;
    }

    translateAndSynthesizeMutation.mutate({ textFr, toLang: language });
  };

  const handlePlayAudio = () => {
    if (!audioUrl) {
      toast({
        title: "⚠️ Attention",
        description: "Aucun audio disponible",
        variant: "destructive",
      });
      return;
    }

    const audio = new Audio(audioUrl);
    audio.play().catch((error) => {
      console.error("Erreur de lecture audio:", error);
      toast({
        title: "❌ Erreur de lecture",
        description: "Impossible de lire l'audio",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Lafricamobile API</h1>
        <p className="text-muted-foreground">
          Testez la traduction et la synthèse vocale en langues africaines
        </p>
      </div>

      {/* Statut des credentials */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hasCredentials ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Statut de l'API
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasCredentials ? (
            <p className="text-green-600 font-medium">
              ✅ Credentials Lafricamobile configurés
            </p>
          ) : (
            <p className="text-red-600 font-medium">
              ❌ Credentials Lafricamobile non configurés
            </p>
          )}
        </CardContent>
      </Card>

      {/* Formulaire de test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Traduction et Synthèse Vocale</CardTitle>
          <CardDescription>
            Entrez un texte en français et sélectionnez une langue africaine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Texte en français */}
          <div className="space-y-2">
            <Label htmlFor="text-fr">Texte en français</Label>
            <Textarea
              id="text-fr"
              value={textFr}
              onChange={(e) => setTextFr(e.target.value)}
              placeholder="Entrez un texte en français..."
              rows={3}
              maxLength={512}
            />
            <p className="text-sm text-muted-foreground">
              {textFr.length} / 512 caractères
            </p>
          </div>

          {/* Sélection de la langue */}
          <div className="space-y-2">
            <Label htmlFor="language">Langue cible</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Sélectionnez une langue" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages?.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleTranslate}
              disabled={translateMutation.isPending || !hasCredentials}
              variant="outline"
            >
              {translateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Languages className="h-4 w-4 mr-2" />
              )}
              Traduire uniquement
            </Button>

            <Button
              onClick={handleSynthesize}
              disabled={synthesizeMutation.isPending || !hasCredentials}
              variant="outline"
            >
              {synthesizeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4 mr-2" />
              )}
              Synthétiser uniquement
            </Button>

            <Button
              onClick={handleTranslateAndSynthesize}
              disabled={translateAndSynthesizeMutation.isPending || !hasCredentials}
            >
              {translateAndSynthesizeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <>
                  <Languages className="h-4 w-4 mr-2" />
                  <Volume2 className="h-4 w-4 mr-2" />
                </>
              )}
              Traduire + Synthétiser
            </Button>
          </div>

          {/* Résultat de la traduction */}
          {translatedText && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>Texte traduit ({language})</Label>
              <p className="font-medium">{translatedText}</p>
            </div>
          )}

          {/* Lecteur audio */}
          {audioUrl && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>Audio généré</Label>
              <div className="flex items-center gap-2">
                <Button onClick={handlePlayAudio} size="sm">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Écouter l'audio
                </Button>
                <a
                  href={audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ouvrir dans un nouvel onglet
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exemples de textes */}
      <Card>
        <CardHeader>
          <CardTitle>Exemples de textes</CardTitle>
          <CardDescription>Cliquez pour utiliser un exemple</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            "Bienvenue sur la plateforme IFN Connect",
            "Enregistrez vos ventes quotidiennes facilement",
            "Vérifiez votre protection sociale",
            "Votre stock est faible, pensez à commander",
            "Félicitations pour votre journée productive !",
          ].map((example, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start text-left h-auto py-2"
              onClick={() => setTextFr(example)}
            >
              {example}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
