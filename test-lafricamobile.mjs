/**
 * Script de test de l'API Lafricamobile
 */

const LAFRICAMOBILE_API_BASE = "https://ttsapi.lafricamobile.com";
const username = process.env.LAFRICAMOBILE_USERNAME;
const password = process.env.LAFRICAMOBILE_PASSWORD;

console.log("🔐 Credentials:");
console.log("Username:", username ? "✅ Défini" : "❌ Non défini");
console.log("Password:", password ? "✅ Défini" : "❌ Non défini");
console.log("");

if (!username || !password) {
  console.error("❌ Les credentials ne sont pas définis");
  process.exit(1);
}

// Test 1: Authentification
console.log("📡 Test 1: Authentification...");
try {
  const authResponse = await fetch(`${LAFRICAMOBILE_API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    console.error("❌ Authentification échouée:", authResponse.status, errorText);
    process.exit(1);
  }

  const authData = await authResponse.json();
  console.log("✅ Authentification réussie");
  console.log("Réponse:", JSON.stringify(authData, null, 2));
  
  const token = authData.access_token || authData.token;
  if (!token) {
    console.error("❌ Token non trouvé dans la réponse");
    process.exit(1);
  }
  console.log("Token:", token.substring(0, 20) + "...");
  console.log("");

  // Test 2: Traduction
  console.log("📡 Test 2: Traduction FR → Dioula...");
  const testPhrases = [
    "Bienvenue sur la plateforme IFN Connect",
    "Enregistrez vos ventes quotidiennes facilement",
    "Vérifiez votre protection sociale",
    "Votre stock est faible, pensez à commander",
    "Félicitations pour votre journée productive !",
  ];

  for (const phrase of testPhrases) {
    const translationResponse = await fetch(`${LAFRICAMOBILE_API_BASE}/tts/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: phrase,
        from_lang: "fr",
        to_lang: "dioula", // Dioula
      }),
    });

    if (!translationResponse.ok) {
      const errorText = await translationResponse.text();
      console.error(`❌ Traduction échouée pour "${phrase}":`, translationResponse.status, errorText);
      continue;
    }

    const translationData = await translationResponse.json();
    console.log(`\n📝 FR: ${phrase}`);
    console.log(`🇲🇱 Dioula: ${translationData.translated_text}`);
  }

  console.log("\n");

  // Test 3: Synthèse vocale
  console.log("📡 Test 3: Synthèse vocale (TTS)...");
  const ttsResponse = await fetch(`${LAFRICAMOBILE_API_BASE}/tts/vocalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      text: "I ni ce, i ka kɛnɛ wa ?", // Bonjour, comment vas-tu ?
      to_lang: "dioula",
      pitch: 1.0,
      speed: 1.0,
    }),
  });

  if (!ttsResponse.ok) {
    const errorText = await ttsResponse.text();
    console.error("❌ TTS échoué:", ttsResponse.status, errorText);
  } else {
    const ttsData = await ttsResponse.json();
    console.log("✅ Audio généré avec succès");
    console.log("URL audio:", ttsData.audio_url ? "✅ Disponible" : "❌ Non disponible");
  }

  console.log("\n✅ Tous les tests sont terminés !");
} catch (error) {
  console.error("❌ Erreur:", error.message);
  process.exit(1);
}
