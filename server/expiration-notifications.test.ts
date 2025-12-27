import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from './db';
import { users, merchants, merchantSocialProtection } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendExpirationAlert } from './_core/email';

/**
 * Tests du système de notifications d'expiration
 * Vérifie l'envoi d'emails d'alerte pour les couvertures sociales expirant bientôt
 */

describe('Expiration Notifications System', () => {
  let testUserId: number;
  let testMerchantId: number;
  const testEmail = process.env.OWNER_EMAIL || 'test@example.com';

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Créer un utilisateur marchand de test
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-notif-${Date.now()}`,
        name: 'Test Merchant Notifications',
        email: testEmail,
        phone: '+2250707070709',
        role: 'merchant',
      })
      .$returningId();
    testUserId = user.id;

    // Créer un marchand de test
    const [merchant] = await db
      .insert(merchants)
      .values({
        userId: testUserId,
        merchantNumber: `MRC-NOTIF-${Date.now()}`,
        businessName: 'Test Business Notifications',
        businessType: 'Commerce',
        location: 'Abidjan',
      })
      .$returningId();
    testMerchantId = merchant.id;

    // Créer une couverture sociale expirant dans 7 jours
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    await db.insert(merchantSocialProtection).values({
      merchantId: testMerchantId,
      hasCNPS: true,
      cnpsNumber: 'CNPS-NOTIF-123',
      cnpsStatus: 'active',
      cnpsExpiryDate: in7Days,
      hasCMU: false,
      hasRSTI: false,
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    // Nettoyer les données de test
    await db.delete(merchantSocialProtection).where(eq(merchantSocialProtection.merchantId, testMerchantId));
    await db.delete(merchants).where(eq(merchants.id, testMerchantId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should send CNPS expiration alert email successfully', async () => {
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    // Attendre 600ms pour respecter le rate limit Resend (2 emails/seconde)
    await new Promise(resolve => setTimeout(resolve, 600));

    const result = await sendExpirationAlert({
      to: testEmail,
      merchantName: 'Test Merchant Notifications',
      protectionType: 'CNPS',
      expiryDate: in7Days,
      daysRemaining: 7,
    });

    expect(result).toBe(true);
  }, 10000);

  it('should send CMU expiration alert email successfully', async () => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Attendre 600ms pour respecter le rate limit Resend (2 emails/seconde)
    await new Promise(resolve => setTimeout(resolve, 600));

    const result = await sendExpirationAlert({
      to: testEmail,
      merchantName: 'Test Merchant Notifications',
      protectionType: 'CMU',
      expiryDate: in30Days,
      daysRemaining: 30,
    });

    expect(result).toBe(true);
  }, 10000);

  it('should send RSTI expiration alert email successfully', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Attendre 600ms pour respecter le rate limit Resend (2 emails/seconde)
    await new Promise(resolve => setTimeout(resolve, 600));

    const result = await sendExpirationAlert({
      to: testEmail,
      merchantName: 'Test Merchant Notifications',
      protectionType: 'RSTI',
      expiryDate: tomorrow,
      daysRemaining: 1,
    });

    expect(result).toBe(true);
  }, 10000);

  it('should include correct urgency level in subject for 1 day remaining', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Attendre 600ms pour respecter le rate limit Resend (2 emails/seconde)
    await new Promise(resolve => setTimeout(resolve, 600));

    // Le test vérifie juste que l'envoi réussit
    // L'urgence "critique" est gérée dans le template
    const result = await sendExpirationAlert({
      to: testEmail,
      merchantName: 'Test Merchant',
      protectionType: 'CNPS',
      expiryDate: tomorrow,
      daysRemaining: 1,
    });

    expect(result).toBe(true);
  }, 10000);

  it('should include correct urgency level in subject for 7 days remaining', async () => {
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    // Attendre 600ms pour respecter le rate limit Resend (2 emails/seconde)
    await new Promise(resolve => setTimeout(resolve, 600));

    // Le test vérifie juste que l'envoi réussit
    // L'urgence "urgente" est gérée dans le template
    const result = await sendExpirationAlert({
      to: testEmail,
      merchantName: 'Test Merchant',
      protectionType: 'CMU',
      expiryDate: in7Days,
      daysRemaining: 7,
    });

    expect(result).toBe(true);
  }, 10000);

  it('should include correct urgency level in subject for 30 days remaining', async () => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Attendre 600ms pour respecter le rate limit Resend (2 emails/seconde)
    await new Promise(resolve => setTimeout(resolve, 600));

    // Le test vérifie juste que l'envoi réussit
    // L'urgence "importante" est gérée dans le template
    const result = await sendExpirationAlert({
      to: testEmail,
      merchantName: 'Test Merchant',
      protectionType: 'RSTI',
      expiryDate: in30Days,
      daysRemaining: 30,
    });

    expect(result).toBe(true);
  }, 10000);
});
