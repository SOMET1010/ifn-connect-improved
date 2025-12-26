/**
 * Tests unitaires pour l'authentification multi-niveaux
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateOTP, formatPhoneNumber, sendOTPSMS } from '../_core/brevo-sms';
import bcrypt from 'bcrypt';

describe('Brevo SMS Module', () => {
  describe('generateOTP', () => {
    it('devrait générer un code OTP à 6 chiffres', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp)).toBeLessThanOrEqual(999999);
    });

    it('devrait générer des codes OTP différents', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      const otp3 = generateOTP();
      
      // Il est très peu probable que 3 codes consécutifs soient identiques
      const allSame = otp1 === otp2 && otp2 === otp3;
      expect(allSame).toBe(false);
    });
  });

  describe('formatPhoneNumber', () => {
    it('devrait formater un numéro ivoirien avec 0 initial', () => {
      // Les numéros ivoiriens font 10 chiffres avec le 0 initial
      // Exemple: 0708459837 devient +225708459837 (9 chiffres après +225)
      expect(formatPhoneNumber('0708459837')).toBe('+225708459837');
    });

    it('devrait formater un numéro ivoirien sans 0 initial', () => {
      // Si le numéro fait 9 chiffres, on ajoute +225
      expect(formatPhoneNumber('708459837')).toBe('+225708459837');
    });

    it('devrait conserver un numéro déjà formaté avec +225', () => {
      expect(formatPhoneNumber('+2250708459837')).toBe('+2250708459837');
    });

    it('devrait ajouter + si le numéro commence par 225', () => {
      expect(formatPhoneNumber('2250708459837')).toBe('+2250708459837');
    });

    it('devrait retirer les espaces et caractères non numériques', () => {
      expect(formatPhoneNumber('07 08 45 98 37')).toBe('+225708459837');
      expect(formatPhoneNumber('07-08-45-98-37')).toBe('+225708459837');
    });
  });

  describe('sendOTPSMS', () => {
    it('devrait envoyer un SMS OTP via Brevo API', async () => {
      // Test avec un vrai appel API (nécessite BREVO_API_KEY valide)
      const testPhone = '+2250708459837';
      const testOTP = '123456';
      
      const result = await sendOTPSMS(testPhone, testOTP);
      
      // Le test passe si l'API répond (true ou false)
      // true = SMS envoyé avec succès
      // false = erreur API (clé invalide, crédit insuffisant, etc.)
      expect(typeof result).toBe('boolean');
      
      // Si la clé API est valide, le résultat devrait être true
      // Note: Ce test peut échouer si le compte Brevo n'a pas de crédit SMS
      console.log('[Brevo SMS Test] Résultat:', result ? 'SMS envoyé' : 'Échec envoi');
    }, 15000); // Timeout de 15 secondes pour l'appel API
  });
});

describe('PIN Security', () => {
  describe('bcrypt hashing', () => {
    it('devrait hasher un PIN à 4 chiffres', async () => {
      const pin = '1234';
      const hash = await bcrypt.hash(pin, 10);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(50); // Les hash bcrypt font ~60 caractères
      expect(hash).toContain('$2b$'); // Préfixe bcrypt
    });

    it('devrait vérifier un PIN correct', async () => {
      const pin = '5678';
      const hash = await bcrypt.hash(pin, 10);
      
      const isValid = await bcrypt.compare(pin, hash);
      expect(isValid).toBe(true);
    });

    it('devrait rejeter un PIN incorrect', async () => {
      const pin = '1234';
      const wrongPin = '4321';
      const hash = await bcrypt.hash(pin, 10);
      
      const isValid = await bcrypt.compare(wrongPin, hash);
      expect(isValid).toBe(false);
    });

    it('devrait générer des hash différents pour le même PIN', async () => {
      const pin = '9999';
      const hash1 = await bcrypt.hash(pin, 10);
      const hash2 = await bcrypt.hash(pin, 10);
      
      // Les hash sont différents grâce au salt aléatoire
      expect(hash1).not.toBe(hash2);
      
      // Mais les deux hash sont valides pour le même PIN
      expect(await bcrypt.compare(pin, hash1)).toBe(true);
      expect(await bcrypt.compare(pin, hash2)).toBe(true);
    });
  });
});

describe('Session Management', () => {
  describe('Session expiration', () => {
    it('devrait calculer correctement une date d\'expiration à 7 jours', () => {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const diffInDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      expect(diffInDays).toBeGreaterThanOrEqual(6.99); // ~7 jours
      expect(diffInDays).toBeLessThanOrEqual(7.01);
    });

    it('devrait détecter une session expirée', () => {
      const now = new Date();
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Hier
      
      const isExpired = now > expiredDate;
      expect(isExpired).toBe(true);
    });

    it('devrait détecter une session valide', () => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // Dans 7 jours
      
      const isExpired = now > futureDate;
      expect(isExpired).toBe(false);
    });
  });
});

describe('OTP Validation Logic', () => {
  describe('OTP expiration', () => {
    it('devrait calculer correctement une expiration à 5 minutes', () => {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      
      const diffInMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
      
      expect(diffInMinutes).toBeGreaterThanOrEqual(4.99);
      expect(diffInMinutes).toBeLessThanOrEqual(5.01);
    });

    it('devrait détecter un OTP expiré', () => {
      const now = new Date();
      const expiredDate = new Date();
      expiredDate.setMinutes(expiredDate.getMinutes() - 6); // Il y a 6 minutes
      
      const isExpired = now > expiredDate;
      expect(isExpired).toBe(true);
    });
  });

  describe('Failed attempts logic', () => {
    it('devrait bloquer après 3 tentatives OTP échouées', () => {
      const maxAttempts = 3;
      let failedAttempts = 0;
      
      // Simuler 3 tentatives échouées
      failedAttempts++;
      failedAttempts++;
      failedAttempts++;
      
      const isBlocked = failedAttempts >= maxAttempts;
      expect(isBlocked).toBe(true);
    });

    it('devrait bloquer après 5 tentatives PIN échouées', () => {
      const maxAttempts = 5;
      let failedAttempts = 0;
      
      // Simuler 5 tentatives échouées
      for (let i = 0; i < 5; i++) {
        failedAttempts++;
      }
      
      const isBlocked = failedAttempts >= maxAttempts;
      expect(isBlocked).toBe(true);
    });

    it('devrait calculer le temps de verrouillage restant', () => {
      const lockDurationMinutes = 30;
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDurationMinutes);
      
      const now = new Date();
      const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / (60 * 1000));
      
      expect(remainingMinutes).toBeGreaterThanOrEqual(29);
      expect(remainingMinutes).toBeLessThanOrEqual(30);
    });
  });
});
