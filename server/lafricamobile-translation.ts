/**
 * Service de traduction via l'API Lafricamobile
 * Traduit du français vers les langues africaines (Dioula, Bambara, Wolof, etc.)
 */

import { getAccessToken } from "./lafricamobile-auth";

const LAFRICAMOBILE_API_BASE = "https://ttsapi.lafricamobile.com";
const MAX_TEXT_LENGTH = 512; // Limite de l'API

export interface TranslationResult {
  text: string;
  to_lang: string;
  translated_text: string;
  post_created_at: string;
}

/**
 * Traduire un texte du français vers une langue africaine
 * @param text Texte à traduire (max 512 caractères)
 * @param toLang Langue cible (ex: "dioula", "bambara", "wolof")
 * @returns Résultat de la traduction
 */
export async function translateText(text: string, toLang: string): Promise<TranslationResult> {
  // Vérifier la longueur du texte
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Le texte dépasse la limite de ${MAX_TEXT_LENGTH} caractères`);
  }

  try {
    // Obtenir le token d'accès
    const accessToken = await getAccessToken();

    // Appeler l'API de traduction
    const response = await fetch(`${LAFRICAMOBILE_API_BASE}/tts/translate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        from_lang: "french",
        to_lang: toLang,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur de traduction Lafricamobile:", errorText);
      throw new Error(`Traduction échouée: ${response.status} ${response.statusText}`);
    }

    const result: TranslationResult = await response.json();
    
    console.log(`✅ Traduction réussie: "${text}" → "${result.translated_text}" (${toLang})`);
    
    return result;
  } catch (error) {
    console.error("Erreur lors de la traduction:", error);
    throw error;
  }
}

/**
 * Traduire plusieurs textes en une seule fois
 * @param texts Liste de textes à traduire
 * @param toLang Langue cible
 * @returns Liste des résultats de traduction
 */
export async function translateMultiple(
  texts: string[],
  toLang: string
): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];

  for (const text of texts) {
    try {
      const result = await translateText(text, toLang);
      results.push(result);
      
      // Petit délai pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Erreur lors de la traduction de "${text}":`, error);
      // Continuer avec les autres textes
    }
  }

  return results;
}

/**
 * Découper un long texte en morceaux de 512 caractères max
 * et traduire chaque morceau
 */
export async function translateLongText(text: string, toLang: string): Promise<string> {
  if (text.length <= MAX_TEXT_LENGTH) {
    const result = await translateText(text, toLang);
    return result.translated_text;
  }

  // Découper le texte en phrases
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= MAX_TEXT_LENGTH) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // Traduire chaque morceau
  const translatedChunks: string[] = [];
  for (const chunk of chunks) {
    const result = await translateText(chunk, toLang);
    translatedChunks.push(result.translated_text);
    
    // Petit délai entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return translatedChunks.join(" ");
}
