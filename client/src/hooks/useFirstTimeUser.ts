import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook pour gérer le mode "Première utilisation"
 * Détecte les nouveaux utilisateurs et gère le tour guidé vocal
 */
export function useFirstTimeUser() {
  const [isNewUser, setIsNewUser] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(5);
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer la progression du tour
  const { data: progress, refetch } = trpc.firstTimeUser.getProgress.useQuery(undefined, {
    enabled: true,
  });

  // Mutation pour démarrer le tour
  const startTour = trpc.firstTimeUser.startTour.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mutation pour compléter une étape
  const completeStep = trpc.firstTimeUser.completeStep.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mutation pour terminer le tour
  const completeTour = trpc.firstTimeUser.completeTour.useMutation({
    onSuccess: () => {
      refetch();
      setShowTour(false);
    },
  });

  // Mutation pour ignorer le tour
  const skipTour = trpc.firstTimeUser.skipTour.useMutation({
    onSuccess: () => {
      refetch();
      setShowTour(false);
    },
  });

  // Vérifier si l'utilisateur est nouveau et doit voir le tour
  useEffect(() => {
    if (progress) {
      setIsLoading(false);
      
      // L'utilisateur est nouveau s'il n'a pas de progression ou si le tour n'est pas terminé/ignoré
      const isNew = !progress || (!progress.completed && !progress.skipped);
      setIsNewUser(isNew);
      
      if (progress && !progress.completed && !progress.skipped) {
        setCurrentStep(progress.currentStep);
        setShowTour(true);
      }
    } else {
      // Pas de progression = nouvel utilisateur
      setIsLoading(false);
      setIsNewUser(true);
      setShowTour(true);
    }
  }, [progress]);

  // Fonction pour passer à l'étape suivante
  const nextStep = async () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      await completeStep.mutateAsync({ step: currentStep });
    } else {
      // Dernière étape complétée
      await completeTour.mutateAsync();
    }
  };

  // Fonction pour ignorer le tour
  const skip = async () => {
    await skipTour.mutateAsync();
  };

  // Fonction pour démarrer le tour manuellement
  const start = async () => {
    await startTour.mutateAsync();
    setShowTour(true);
    setCurrentStep(1);
  };

  return {
    isNewUser,
    currentStep,
    totalSteps,
    showTour,
    isLoading,
    nextStep,
    skip,
    start,
    progress,
  };
}
