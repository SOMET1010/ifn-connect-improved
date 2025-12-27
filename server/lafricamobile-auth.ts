/**
 * Service d'authentification pour l'API Lafricamobile
 * Gère l'obtention et le renouvellement automatique du token d'accès
 */

import { ENV } from "./_core/env";

const LAFRICAMOBILE_API_BASE = "https://ttsapi.lafricamobile.com";
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes avant expiration

interface AuthToken {
  access_token: string;
  token_type: string;
  expires_at: number; // Timestamp d'expiration
}

// Cache du token en mémoire
let cachedToken: AuthToken | null = null;

/**
 * Authentifier auprès de l'API Lafricamobile
 */
async function authenticate(): Promise<AuthToken> {
  const username = process.env.LAFRICAMOBILE_USERNAME;
  const password = process.env.LAFRICAMOBILE_PASSWORD;

  if (!username || !password) {
    throw new Error("LAFRICAMOBILE_USERNAME et LAFRICAMOBILE_PASSWORD doivent être définis");
  }

  try {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("grant_type", "password");
    formData.append("scope", "");

    const response = await fetch(`${LAFRICAMOBILE_API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur d'authentification Lafricamobile:", errorText);
      throw new Error(`Authentification échouée: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Calculer l'expiration (par défaut 1 heure si non spécifié)
    const expiresIn = data.expires_in || 3600; // secondes
    const expiresAt = Date.now() + expiresIn * 1000;

    const token: AuthToken = {
      access_token: data.access_token,
      token_type: data.token_type || "Bearer",
      expires_at: expiresAt,
    };

    // Mettre en cache
    cachedToken = token;

    console.log("✅ Authentification Lafricamobile réussie");
    return token;
  } catch (error) {
    console.error("Erreur lors de l'authentification Lafricamobile:", error);
    throw error;
  }
}

/**
 * Vérifier si le token est encore valide
 */
function isTokenValid(token: AuthToken | null): boolean {
  if (!token) return false;
  // Vérifier si le token expire dans moins de 5 minutes
  return token.expires_at > Date.now() + TOKEN_EXPIRY_BUFFER;
}

/**
 * Obtenir un token d'accès valide (avec renouvellement automatique)
 */
export async function getAccessToken(): Promise<string> {
  // Si le token en cache est valide, le retourner
  if (isTokenValid(cachedToken)) {
    return cachedToken!.access_token;
  }

  // Sinon, obtenir un nouveau token
  const token = await authenticate();
  return token.access_token;
}

/**
 * Forcer le renouvellement du token
 */
export async function refreshToken(): Promise<string> {
  cachedToken = null;
  return await getAccessToken();
}

/**
 * Vérifier si les credentials sont configurés
 */
export function hasCredentials(): boolean {
  return Boolean(process.env.LAFRICAMOBILE_USERNAME && process.env.LAFRICAMOBILE_PASSWORD);
}
