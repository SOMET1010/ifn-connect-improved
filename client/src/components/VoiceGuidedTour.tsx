import { useEffect, useState } from "react";
import { X, Volume2, VolumeX, ChevronRight, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";
import { useSpeech } from "@/hooks/useSpeech";

/**
 * Composant VoiceGuidedTour
 * Tour guidé vocal en 5 étapes pour les nouveaux marchands
 * Interface bilingue (Français/Dioula)
 */

// Définition des 5 étapes du tour guidé
const TOUR_STEPS = [
  {
    id: 1,
    title: "Ouvrir/Fermer ma journée",
    titleDioula: "I ka tile daminɛ/ban",
    description: "Chaque jour, commencez par ouvrir votre journée et terminez en la fermant. Cela vous aide à suivre vos heures de travail.",
    descriptionDioula: "Tile bɛɛ, i ka i ka baara daminɛ ani ka a ban. O bɛ i dɛmɛ ka i ka baara waatiw lajɛ.",
    voiceText: "Bienvenue ! Première étape : Chaque jour, ouvrez votre journée en cliquant sur le bouton Ouvrir ma journée. Le soir, fermez-la pour suivre vos heures de travail.",
    voiceTextDioula: "I ni ce ! Fɔlɔ : Tile bɛɛ, i ka i ka baara daminɛ ni i ye butɔn digi. Su la, i ka a ban walasa ka i ka baara waatiw lajɛ.",
    icon: "📅",
    targetElement: null, // Pas de highlight spécifique pour cette étape
  },
  {
    id: 2,
    title: "Enregistrer une vente",
    titleDioula: "Feereli sɛbɛn",
    description: "Utilisez la caisse pour enregistrer vos ventes. Vous pouvez taper les chiffres ou parler pour aller plus vite.",
    descriptionDioula: "I ka caisse baara kɛ walasa ka i ka feereliw sɛbɛn. I bɛ se ka jatew sɛbɛn walima ka kuma walasa ka teliya.",
    voiceText: "Deuxième étape : Pour enregistrer une vente, allez dans Caisse. Tapez le montant ou utilisez la commande vocale en disant par exemple : Vendre 3 tas de tomates à 1000 francs.",
    voiceTextDioula: "Filanan : Walasa ka feereli sɛbɛn, i ka taga Caisse la. I ka wari hakɛ sɛbɛn walima ka baara kɛ ni kan ye ni i ye a fɔ ko : Feereli 3 tomati 1000 francs.",
    icon: "💰",
    targetElement: null,
  },
  {
    id: 3,
    title: "Utiliser les commandes vocales",
    titleDioula: "Kan fɔcogo baara kɛ",
    description: "Cliquez sur le bouton microphone et parlez. L'application comprend le français et le dioula.",
    descriptionDioula: "I ye mikrofɔn butɔn digi ani ka kuma. Application bɛ faransi ni dioula faamuy.",
    voiceText: "Troisième étape : Utilisez votre voix ! Cliquez sur le bouton microphone et dites ce que vous voulez faire. L'application comprend le français et le dioula.",
    voiceTextDioula: "Sabanan : I ka i ka kan baara kɛ ! I ye mikrofɔn butɔn digi ani ka fɔ i b'a fɛ ka kɛ. Application bɛ faransi ni dioula faamuy.",
    icon: "🎤",
    targetElement: null,
  },
  {
    id: 4,
    title: "Commander des produits",
    titleDioula: "Fɛnw daminɛ",
    description: "Allez dans Marché Virtuel pour commander des produits. Vous pouvez payer avec Mobile Money (Orange, MTN, Wave, Moov).",
    descriptionDioula: "I ka taga Marché Virtuel la walasa ka fɛnw daminɛ. I bɛ se ka sara kɛ ni Mobile Money ye (Orange, MTN, Wave, Moov).",
    voiceText: "Quatrième étape : Pour commander des produits, allez dans Marché Virtuel. Choisissez vos produits et payez avec Mobile Money : Orange, MTN, Wave ou Moov.",
    voiceTextDioula: "Naanin : Walasa ka fɛnw daminɛ, i ka taga Marché Virtuel la. I ka i ka fɛnw sugandi ani ka sara kɛ ni Mobile Money ye : Orange, MTN, Wave walima Moov.",
    icon: "🛒",
    targetElement: null,
  },
  {
    id: 5,
    title: "Vérifier ma protection sociale",
    titleDioula: "N ka CNPS/CMU lajɛ",
    description: "Consultez votre couverture CNPS (retraite) et CMU (santé). Renouvelez-les avant qu'elles n'expirent.",
    descriptionDioula: "I ka i ka CNPS (kɔrɔbaga) ani CMU (kɛnɛya) lajɛ. I ka u yɛlɛma sani u ka ban.",
    voiceText: "Dernière étape : Vérifiez votre protection sociale. Allez dans Protection Sociale pour voir votre CNPS pour la retraite et votre CMU pour la santé. Renouvelez-les avant qu'elles n'expirent.",
    voiceTextDioula: "Laban : I ka i ka jama sabati lajɛ. I ka taga Protection Sociale la walasa ka i ka CNPS (kɔrɔbaga) ani i ka CMU (kɛnɛya) ye. I ka u yɛlɛma sani u ka ban.",
    icon: "🛡️",
    targetElement: null,
  },
];

export function VoiceGuidedTour() {
  const { currentStep, totalSteps, showTour, nextStep, skip, isLoading } = useFirstTimeUser();
  const { speak, stop, isEnabled, toggle: toggleSpeech } = useSpeech();
  const [language, setLanguage] = useState<"fr" | "dioula">("fr");

  // Récupérer l'étape actuelle
  const step = TOUR_STEPS.find((s) => s.id === currentStep) || TOUR_STEPS[0];

  // Lire automatiquement le texte vocal quand l'étape change
  useEffect(() => {
    if (showTour && step && isEnabled) {
      const textToSpeak = language === "dioula" ? step.voiceTextDioula : step.voiceText;
      // Délai de 500ms pour laisser le temps au composant de s'afficher
      setTimeout(() => {
        speak(textToSpeak, { lang: language === "dioula" ? "dyu" : "fr-FR" });
      }, 500);
    }

    // Arrêter la lecture quand le composant se démonte
    return () => {
      stop();
    };
  }, [currentStep, showTour, language, isEnabled]);

  // Ne rien afficher si le tour n'est pas actif ou en chargement
  if (!showTour || isLoading) {
    return null;
  }

  const handleNext = async () => {
    stop(); // Arrêter la lecture vocale avant de passer à l'étape suivante
    await nextStep();
  };

  const handleSkip = async () => {
    stop();
    await skip();
  };

  const handleReplay = () => {
    const textToSpeak = language === "dioula" ? step.voiceTextDioula : step.voiceText;
    speak(textToSpeak, { lang: language === "dioula" ? "dyu" : "fr-FR" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="relative w-full max-w-2xl mx-4 p-8 bg-gradient-to-br from-orange-50 to-green-50 border-4 border-orange-500 shadow-2xl">
        {/* Bouton fermer */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Fermer le tour guidé"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>

        {/* Barre de progression */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Étape {currentStep} sur {totalSteps}
            </span>
            <div className="flex gap-2">
              {/* Bouton changer de langue */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "fr" ? "dioula" : "fr")}
                className="text-xs"
              >
                {language === "fr" ? "🇨🇮 Dioula" : "🇫🇷 Français"}
              </Button>
              {/* Bouton audio */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSpeech}
                className={isEnabled ? "bg-green-100 border-green-500" : ""}
              >
                {isEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Icône géante de l'étape */}
        <div className="text-center mb-6">
          <div className="text-9xl mb-4">{step.icon}</div>
        </div>

        {/* Titre de l'étape */}
        <h2 className="text-4xl font-bold text-center mb-3 text-gray-800">
          {language === "dioula" ? step.titleDioula : step.title}
        </h2>

        {/* Description de l'étape */}
        <p className="text-2xl text-center mb-8 text-gray-700 leading-relaxed">
          {language === "dioula" ? step.descriptionDioula : step.description}
        </p>

        {/* Boutons d'action */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSkip}
            className="text-xl px-8 py-6 border-2"
          >
            Passer le tour
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleReplay}
            className="text-xl px-8 py-6 border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Volume2 className="h-6 w-6 mr-2" />
            Réécouter
          </Button>
          <Button
            size="lg"
            onClick={handleNext}
            className="text-xl px-8 py-6 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white"
          >
            {currentStep === totalSteps ? (
              <>
                <Check className="h-6 w-6 mr-2" />
                Terminer
              </>
            ) : (
              <>
                Suivant
                <ChevronRight className="h-6 w-6 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
