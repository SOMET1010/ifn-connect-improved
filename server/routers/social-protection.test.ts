import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import { users, merchants, merchantSocialProtection, socialProtectionRenewals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Tests unitaires pour le router social-protection
 * Teste le workflow complet de renouvellement CNPS/CMU/RSTI
 */

describe('Social Protection Router', () => {
  let testUserId: number;
  let testMerchantId: number;
  let testAdminId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Créer un utilisateur marchand de test
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-merchant-${Date.now()}`,
        name: 'Test Merchant',
        email: 'test.merchant@example.com',
        phone: '+2250707070707',
        role: 'merchant',
      })
      .$returningId();
    testUserId = user.id;

    // Créer un marchand de test
    const [merchant] = await db
      .insert(merchants)
      .values({
        userId: testUserId,
        merchantNumber: `MRC-TEST-${Date.now()}`,
        businessName: 'Test Business',
        businessType: 'Commerce',
        location: 'Abidjan',
      })
      .$returningId();
    testMerchantId = merchant.id;

    // Créer une entrée de couverture sociale avec dates d'expiration
    const now = new Date();
    const in15Days = new Date();
    in15Days.setDate(in15Days.getDate() + 15);

    await db.insert(merchantSocialProtection).values({
      merchantId: testMerchantId,
      hasCNPS: true,
      cnpsNumber: 'CNPS-TEST-123',
      cnpsStatus: 'active',
      cnpsExpiryDate: in15Days,
      hasCMU: true,
      cmuNumber: 'CMU-TEST-456',
      cmuStatus: 'active',
      cmuExpiryDate: in15Days,
    });

    // Créer un utilisateur admin de test
    const [admin] = await db
      .insert(users)
      .values({
        openId: `test-admin-${Date.now()}`,
        name: 'Test Admin',
        email: 'test.admin@example.com',
        role: 'admin',
      })
      .$returningId();
    testAdminId = admin.id;
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    // Nettoyer les données de test
    await db.delete(socialProtectionRenewals).where(eq(socialProtectionRenewals.merchantId, testMerchantId));
    await db.delete(merchantSocialProtection).where(eq(merchantSocialProtection.merchantId, testMerchantId));
    await db.delete(merchants).where(eq(merchants.id, testMerchantId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(users).where(eq(users.id, testAdminId));
  });

  it('should create a renewal request (marchand)', async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const in1Year = new Date();
    in1Year.setFullYear(in1Year.getFullYear() + 1);

    const result = await caller.socialProtection.createRenewal({
      type: 'cnps',
      requestedExpiryDate: in1Year.toISOString(),
      merchantNotes: 'Test renewal request',
    });

    expect(result.success).toBe(true);
    expect(result.renewalId).toBeDefined();
    expect(result.message).toContain('CNPS');
  });

  it('should list renewals for a merchant', async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    // Créer une demande
    const in1Year = new Date();
    in1Year.setFullYear(in1Year.getFullYear() + 1);

    await caller.socialProtection.createRenewal({
      type: 'cnps',
      requestedExpiryDate: in1Year.toISOString(),
      merchantNotes: 'Test renewal',
    });

    // Récupérer la liste
    const renewals = await caller.socialProtection.listByMerchant({
      limit: 10,
      offset: 0,
    });

    expect(renewals).toBeDefined();
    expect(renewals.length).toBeGreaterThan(0);
    expect(renewals[0].type).toBe('cnps');
    expect(renewals[0].status).toBe('pending');
  });

  it('should list pending renewals (admin)', async () => {
    const merchantCaller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const adminCaller = appRouter.createCaller({
      user: { id: testAdminId, role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    // Créer une demande en tant que marchand
    const in1Year = new Date();
    in1Year.setFullYear(in1Year.getFullYear() + 1);

    await merchantCaller.socialProtection.createRenewal({
      type: 'cmu',
      requestedExpiryDate: in1Year.toISOString(),
    });

    // Récupérer les demandes en attente en tant qu'admin
    const pending = await adminCaller.socialProtection.listPending({
      limit: 50,
      offset: 0,
      type: 'all',
    });

    expect(pending).toBeDefined();
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.some(r => r.merchantId === testMerchantId)).toBe(true);
  });

  it('should approve a renewal request (admin)', async () => {
    const merchantCaller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const adminCaller = appRouter.createCaller({
      user: { id: testAdminId, role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    // Créer une demande
    const in1Year = new Date();
    in1Year.setFullYear(in1Year.getFullYear() + 1);

    const { renewalId } = await merchantCaller.socialProtection.createRenewal({
      type: 'cnps',
      requestedExpiryDate: in1Year.toISOString(),
    });

    // Approuver la demande
    const result = await adminCaller.socialProtection.approve({
      renewalId,
      adminNotes: 'Approved for testing',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('approuvée');

    // Vérifier que la date d'expiration a été mise à jour
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    const [protection] = await db
      .select()
      .from(merchantSocialProtection)
      .where(eq(merchantSocialProtection.merchantId, testMerchantId))
      .limit(1);

    expect(protection.cnpsExpiryDate).toBeDefined();
    expect(new Date(protection.cnpsExpiryDate!).getTime()).toBeCloseTo(in1Year.getTime(), -5);
  });

  it('should reject a renewal request (admin)', async () => {
    const merchantCaller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const adminCaller = appRouter.createCaller({
      user: { id: testAdminId, role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    // Créer une demande
    const in1Year = new Date();
    in1Year.setFullYear(in1Year.getFullYear() + 1);

    const { renewalId } = await merchantCaller.socialProtection.createRenewal({
      type: 'cmu',
      requestedExpiryDate: in1Year.toISOString(),
    });

    // Rejeter la demande
    const result = await adminCaller.socialProtection.reject({
      renewalId,
      adminNotes: 'Justificatif invalide',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('rejetée');

    // Vérifier que le statut est bien "rejected"
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    const [renewal] = await db
      .select()
      .from(socialProtectionRenewals)
      .where(eq(socialProtectionRenewals.id, renewalId))
      .limit(1);

    expect(renewal.status).toBe('rejected');
    expect(renewal.adminNotes).toBe('Justificatif invalide');
  });

  it('should get renewal statistics (admin)', async () => {
    const merchantCaller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const adminCaller = appRouter.createCaller({
      user: { id: testAdminId, role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    // Créer plusieurs demandes
    const in1Year = new Date();
    in1Year.setFullYear(in1Year.getFullYear() + 1);

    await merchantCaller.socialProtection.createRenewal({
      type: 'cnps',
      requestedExpiryDate: in1Year.toISOString(),
    });

    await merchantCaller.socialProtection.createRenewal({
      type: 'cmu',
      requestedExpiryDate: in1Year.toISOString(),
    });

    // Récupérer les statistiques
    const stats = await adminCaller.socialProtection.getStats();

    expect(stats).toBeDefined();
    expect(stats.totalPending).toBeGreaterThanOrEqual(2);
    expect(stats.totalCnps).toBeGreaterThanOrEqual(1);
    expect(stats.totalCmu).toBeGreaterThanOrEqual(1);
  });

  it('should detect expiring protections (admin)', async () => {
    const adminCaller = appRouter.createCaller({
      user: { id: testAdminId, role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    // Récupérer les couvertures expirant dans 30 jours
    const expiring = await adminCaller.socialProtection.getExpiringProtections({
      daysThreshold: 30,
    });

    expect(expiring).toBeDefined();
    // Notre marchand de test a une couverture expirant dans 15 jours
    expect(expiring.some(p => p.merchantId === testMerchantId)).toBe(true);
  });

  it('should prevent non-admin from approving renewals', async () => {
    const merchantCaller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const in1Year = new Date();
    in1Year.setFullYear(in1Year.getFullYear() + 1);

    const { renewalId } = await merchantCaller.socialProtection.createRenewal({
      type: 'cnps',
      requestedExpiryDate: in1Year.toISOString(),
    });

    // Tenter d'approuver en tant que marchand (doit échouer)
    await expect(
      merchantCaller.socialProtection.approve({
        renewalId,
        adminNotes: 'Tentative non autorisée',
      })
    ).rejects.toThrow('Accès réservé aux administrateurs');
  });

  it('should prevent approving already processed renewals', async () => {
    const merchantCaller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const adminCaller = appRouter.createCaller({
      user: { id: testAdminId, role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    const in1Year = new Date();
    in1Year.setFullYear(in1Year.getFullYear() + 1);

    const { renewalId } = await merchantCaller.socialProtection.createRenewal({
      type: 'cnps',
      requestedExpiryDate: in1Year.toISOString(),
    });

    // Approuver une première fois
    await adminCaller.socialProtection.approve({
      renewalId,
    });

    // Tenter d'approuver à nouveau (doit échouer)
    await expect(
      adminCaller.socialProtection.approve({
        renewalId,
      })
    ).rejects.toThrow('déjà été traitée');
  });
});
