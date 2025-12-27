import { describe, it, expect } from "vitest";
import { getAccessToken, hasCredentials, refreshToken } from "./lafricamobile-auth";

describe("Lafricamobile Authentication", () => {
  it("should have credentials configured", () => {
    expect(hasCredentials()).toBe(true);
  });

  it("should successfully authenticate and get access token", async () => {
    const token = await getAccessToken();
    
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    
    console.log("✅ Token obtenu avec succès:", token.substring(0, 20) + "...");
  }, 10000); // Timeout de 10 secondes pour l'appel API

  it("should use cached token on second call", async () => {
    const token1 = await getAccessToken();
    const token2 = await getAccessToken();
    
    // Les deux tokens doivent être identiques (cache)
    expect(token1).toBe(token2);
    
    console.log("✅ Token en cache utilisé correctement");
  }, 10000);

  it("should refresh token when forced", async () => {
    const token1 = await getAccessToken();
    
    // Attendre 1 seconde pour s'assurer qu'un nouveau token pourrait être différent
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const token2 = await refreshToken();
    
    // Le nouveau token peut être identique ou différent selon l'API
    expect(token2).toBeDefined();
    expect(typeof token2).toBe("string");
    
    console.log("✅ Token rafraîchi avec succès");
  }, 15000);
});
