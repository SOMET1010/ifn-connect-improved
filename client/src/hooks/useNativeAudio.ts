import { useRef, useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook pour gérer la lecture d'audio avec logique hybride :
 * 1. Priorité : Enregistrements natifs (si disponibles)
 * 2. Fallback : API Lafricamobile (traduction + TTS automatique)
 * 3. Fallback final : Synthèse vocale locale (Web Speech API)
 * 
 * @param contextKey - Clé du contexte (ex: "tour_step_1", "morning_briefing_intro")
 * @param language - Code de la langue (ex: "fr", "dioula")
 * @param fallbackText - Texte de fallback pour la synthèse vocale si pas d'enregistrement
 * @returns Fonctions pour contrôler la lecture audio
 */
export function useNativeAudio(
  contextKey: string,
  language: string = "fr",
  fallbackText?: string
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);
  const [audioSource, setAudioSource] = useState<"native" | "lafricamobile" | "local" | null>(null);

  // Récupérer l'enregistrement vocal natif
  const { data: recording } = trpc.voiceRecordings.get.useQuery(
    { contextKey, language },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60, // 1 heure
    }
  );

  // Vérifier si Lafricamobile est disponible
  const { data: hasLafricamobile } = trpc.lafricamobile.hasCredentials.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // 1 heure
  });

  // Mutation pour traduire et synthétiser avec Lafricamobile
  const lafricaMutation = trpc.lafricamobile.translateAndSynthesize.useMutation();

  // Initialiser l'audio player
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.addEventListener("ended", () => {
        isPlayingRef.current = false;
      });
      
      audioRef.current.addEventListener("error", (e) => {
        console.error("Erreur de lecture audio:", e);
        isPlayingRef.current = false;
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (synthRef.current) {
        window.speechSynthesis.cancel();
        synthRef.current = null;
      }
    };
  }, []);

  /**
   * Jouer l'audio avec logique hybride
   */
  const play = useCallback(async () => {
    // Arrêter toute lecture en cours
    stop();

    // PRIORITÉ 1 : Enregistrement natif
    if (recording?.audioUrl && audioRef.current) {
      try {
        audioRef.current.src = recording.audioUrl;
        await audioRef.current.play();
        isPlayingRef.current = true;
        setAudioSource("native");
        console.log(`🎤 Lecture audio native: ${contextKey} (${language})`);
        return;
      } catch (error) {
        console.error("Erreur lors de la lecture audio native:", error);
      }
    }

    // PRIORITÉ 2 : API Lafricamobile (seulement pour Dioula et autres langues africaines)
    if (hasLafricamobile && language !== "fr" && fallbackText && audioRef.current) {
      try {
        console.log(`🌍 Utilisation de Lafricamobile pour ${language}...`);
        
        const result = await lafricaMutation.mutateAsync({
          textFr: fallbackText,
          toLang: language,
          pitch: 0.0,
          speed: 0.9, // Légèrement plus lent pour meilleure compréhension
        });

        audioRef.current.src = result.audioUrl;
        await audioRef.current.play();
        isPlayingRef.current = true;
        setAudioSource("lafricamobile");
        console.log(`✅ Lafricamobile: "${fallbackText}" → "${result.translatedText}"`);
        return;
      } catch (error) {
        console.error("Erreur Lafricamobile, fallback vers synthèse locale:", error);
      }
    }

    // PRIORITÉ 3 : Synthèse vocale locale (Web Speech API)
    playLocalSynthesis();
  }, [recording, hasLafricamobile, contextKey, language, fallbackText, lafricaMutation]);

  /**
   * Jouer le texte avec la synthèse vocale locale (fallback final)
   */
  const playLocalSynthesis = useCallback(() => {
    if (!fallbackText) {
      console.warn(`Pas d'enregistrement natif ni de texte de fallback pour ${contextKey}`);
      return;
    }

    if ("speechSynthesis" in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(fallbackText);
        utterance.lang = language === "dioula" ? "fr-FR" : `${language}-FR`;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        utterance.onend = () => {
          isPlayingRef.current = false;
        };
        
        utterance.onerror = (e) => {
          console.error("Erreur de synthèse vocale:", e);
          isPlayingRef.current = false;
        };

        synthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        isPlayingRef.current = true;
        setAudioSource("local");
        console.log(`🔊 Synthèse vocale locale (fallback): ${contextKey} (${language})`);
      } catch (error) {
        console.error("Erreur lors de la synthèse vocale:", error);
      }
    } else {
      console.warn("La synthèse vocale n'est pas supportée par ce navigateur");
    }
  }, [fallbackText, contextKey, language]);

  /**
   * Arrêter la lecture audio
   */
  const stop = useCallback(() => {
    // Arrêter l'audio natif
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Arrêter la synthèse vocale
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    isPlayingRef.current = false;
    setAudioSource(null);
  }, []);

  /**
   * Mettre en pause la lecture audio
   */
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    isPlayingRef.current = false;
  }, []);

  /**
   * Reprendre la lecture audio
   */
  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused && audioRef.current.src) {
      audioRef.current.play();
      isPlayingRef.current = true;
    } else if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      isPlayingRef.current = true;
    }
  }, []);

  /**
   * Vérifier si un enregistrement natif existe
   */
  const hasNativeRecording = Boolean(recording?.audioUrl);

  /**
   * Vérifier si Lafricamobile est disponible
   */
  const hasLafricamobileSupport = Boolean(hasLafricamobile);

  /**
   * Vérifier si la lecture est en cours
   */
  const isPlaying = () => isPlayingRef.current;

  return {
    play,
    stop,
    pause,
    resume,
    isPlaying,
    hasNativeRecording,
    hasLafricamobileSupport,
    audioSource, // Indique quelle source audio est utilisée
    recording,
  };
}

/**
 * Hook simplifié pour jouer un audio natif une seule fois
 * Utile pour les alertes et notifications
 */
export function useNativeAudioOnce(
  contextKey: string,
  language: string = "fr",
  fallbackText?: string,
  autoPlay: boolean = false
) {
  const { play, hasNativeRecording, hasLafricamobileSupport, audioSource } = useNativeAudio(
    contextKey,
    language,
    fallbackText
  );

  useEffect(() => {
    if (autoPlay) {
      // Délai pour éviter les problèmes de lecture automatique
      const timer = setTimeout(() => {
        play();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoPlay, play]);

  return { play, hasNativeRecording, hasLafricamobileSupport, audioSource };
}
