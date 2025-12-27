/**
 * Service de synthèse vocale (Text-to-Speech) via l'API Lafricamobile
 * Génère des fichiers audio en langues africaines (Dioula, Bambara, Wolof, etc.)
 */

import { getAccessToken } from "./lafricamobile-auth";

const LAFRICAMOBILE_API_BASE = "https://ttsapi.lafricamobile.com";

export interface TTSResult {
  text: string;
  to_lang: string;
  path_audio: string; // URL du fichier audio généré
  post_created_at: string;
}

export interface TTSOptions {
  pitch?: number; // Fréquence du son (grave/aigu), default: 0.0
  speed?: number; // Vitesse de lecture, default: 1.0
}

/**
 * Synthétiser un texte en audio
 * @param text Texte à synthétiser
 * @param toLang Langue de synthèse (ex: "dioula", "bambara", "wolof")
 * @param options Options de synthèse (pitch, speed)
 * @returns Résultat avec l'URL du fichier audio
 */
export async function synthesizeText(
  text: string,
  toLang: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  try {
    // Obtenir le token d'accès
    const accessToken = await getAccessToken();

    // Préparer les paramètres
    const { pitch = 0.0, speed = 1.0 } = options;

    // Appeler l'API de synthèse vocale
    const response = await fetch(`${LAFRICAMOBILE_API_BASE}/tts/vocalize`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        to_lang: toLang,
        pitch,
        speed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur de synthèse vocale Lafricamobile:", errorText);
      throw new Error(`Synthèse vocale échouée: ${response.status} ${response.statusText}`);
    }

    const result: TTSResult = await response.json();
    
    console.log(`✅ Synthèse vocale réussie: "${text}" → ${result.path_audio} (${toLang})`);
    
    return result;
  } catch (error) {
    console.error("Erreur lors de la synthèse vocale:", error);
    throw error;
  }
}

/**
 * Traduire ET synthétiser un texte en une seule opération
 * @param textFr Texte en français
 * @param toLang Langue cible
 * @param options Options de synthèse
 * @returns Résultat avec le texte traduit et l'URL audio
 */
export async function translateAndSynthesize(
  textFr: string,
  toLang: string,
  options: TTSOptions = {}
): Promise<{ translatedText: string; audioUrl: string }> {
  // Import dynamique pour éviter les dépendances circulaires
  const { translateText } = await import("./lafricamobile-translation");

  try {
    // Étape 1 : Traduire le texte
    const translation = await translateText(textFr, toLang);
    const translatedText = translation.translated_text;

    // Étape 2 : Synthétiser le texte traduit
    const tts = await synthesizeText(translatedText, toLang, options);

    return {
      translatedText,
      audioUrl: tts.path_audio,
    };
  } catch (error) {
    console.error("Erreur lors de la traduction et synthèse:", error);
    throw error;
  }
}

/**
 * Télécharger le fichier audio depuis l'URL Lafricamobile
 * @param audioUrl URL du fichier audio
 * @returns Buffer du fichier audio
 */
export async function downloadAudio(audioUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(audioUrl);

    if (!response.ok) {
      throw new Error(`Téléchargement échoué: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'audio:", error);
    throw error;
  }
}

/**
 * Synthétiser et télécharger l'audio en une seule opération
 * @param text Texte à synthétiser
 * @param toLang Langue de synthèse
 * @param options Options de synthèse
 * @returns Buffer du fichier audio
 */
export async function synthesizeAndDownload(
  text: string,
  toLang: string,
  options: TTSOptions = {}
): Promise<{ audioBuffer: Buffer; audioUrl: string }> {
  const result = await synthesizeText(text, toLang, options);
  const audioBuffer = await downloadAudio(result.path_audio);

  return {
    audioBuffer,
    audioUrl: result.path_audio,
  };
}
