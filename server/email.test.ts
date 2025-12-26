import { describe, it, expect } from 'vitest';
import { sendEmail } from './_core/email';

/**
 * Tests de validation des clés API Resend
 * Vérifie que les credentials Resend sont correctement configurés
 */

describe('Resend Email Service', () => {
  it('should have RESEND_API_KEY configured', () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    // Accepter les clés de production (re_) et de test (e_)
    expect(process.env.RESEND_API_KEY).toMatch(/^(re_|e_)/);
  });

  it('should have RESEND_FROM_EMAIL configured', () => {
    expect(process.env.RESEND_FROM_EMAIL).toBeDefined();
    expect(process.env.RESEND_FROM_EMAIL).toContain('@');
  });

  it('should send a test email successfully', async () => {
    // Utiliser l'email du propriétaire pour le test
    const testEmail = process.env.OWNER_EMAIL || 'test@example.com';

    const result = await sendEmail({
      to: testEmail,
      subject: '[TEST] Validation Resend API',
      html: '<p>Ceci est un email de test pour valider la configuration Resend.</p>',
      text: 'Ceci est un email de test pour valider la configuration Resend.',
    });

    expect(result).toBe(true);
  }, 10000); // Timeout de 10 secondes pour l'appel API
});
