import { describe, it, expect } from 'vitest';
import { generateCertificate } from './certificates';

describe('Génération de Certificat Professionnel', () => {
  it('devrait générer un certificat PDF valide', async () => {
    const mockMerchant = {
      id: 1,
      userId: 1,
      businessName: 'KONE FATOUMATA',
      merchantNumber: 'MRC-00001',
      location: 'Marché de Cocody',
      cnpsStatus: 'active' as const,
      cmuStatus: 'active' as const,
      cnpsNumber: 'CNPS-123456',
      cmuNumber: 'CMU-789012',
      enrolledAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      status: 'active' as const,
      photoUrl: null,
      cnpsExpiryDate: null,
      cmuExpiryDate: null,
      marketId: null,
      cooperativeId: null,
    };

    const certificateData = {
      merchant: mockMerchant,
      level: 'Confirmé',
      levelColor: '#2ECC71',
      badgesCount: 3,
      totalSales: 750000,
      enrollmentDate: new Date('2024-01-15'),
    };

    const pdfBuffer = await generateCertificate(certificateData);

    // Vérifier que le PDF est généré
    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Vérifier que c'est bien un PDF (commence par %PDF)
    const pdfHeader = pdfBuffer.toString('utf8', 0, 4);
    expect(pdfHeader).toBe('%PDF');

    // Vérifier la taille minimale du PDF (doit contenir du contenu)
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  it('devrait gérer différents niveaux de marchands', async () => {
    const mockMerchant = {
      id: 2,
      userId: 2,
      businessName: 'TRAORE MARIAM',
      merchantNumber: 'MRC-00002',
      location: 'Marché d\'Adjamé',
      cnpsStatus: 'pending' as const,
      cmuStatus: 'pending' as const,
      cnpsNumber: null,
      cmuNumber: null,
      enrolledAt: new Date('2024-06-01'),
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date(),
      status: 'active' as const,
      photoUrl: null,
      cnpsExpiryDate: null,
      cmuExpiryDate: null,
      marketId: null,
      cooperativeId: null,
    };

    const certificateData = {
      merchant: mockMerchant,
      level: 'Débutant',
      levelColor: '#95A5A6',
      badgesCount: 1,
      totalSales: 50000,
      enrollmentDate: new Date('2024-06-01'),
    };

    const pdfBuffer = await generateCertificate(certificateData);

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Vérifier que c'est un PDF valide
    const pdfHeader = pdfBuffer.toString('utf8', 0, 4);
    expect(pdfHeader).toBe('%PDF');
  });

  it('devrait inclure le QR code de vérification', async () => {
    const mockMerchant = {
      id: 3,
      userId: 3,
      businessName: 'OUATTARA SALIMATA',
      merchantNumber: 'MRC-00003',
      location: 'Marché de Treichville',
      cnpsStatus: 'active' as const,
      cmuStatus: 'active' as const,
      cnpsNumber: 'CNPS-999999',
      cmuNumber: 'CMU-888888',
      enrolledAt: new Date('2023-12-01'),
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date(),
      status: 'active' as const,
      photoUrl: null,
      cnpsExpiryDate: null,
      cmuExpiryDate: null,
      marketId: null,
      cooperativeId: null,
    };

    const certificateData = {
      merchant: mockMerchant,
      level: 'Expert',
      levelColor: '#3498DB',
      badgesCount: 5,
      totalSales: 2500000,
      enrollmentDate: new Date('2023-12-01'),
    };

    const pdfBuffer = await generateCertificate(certificateData);

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    
    // Vérifier que le PDF contient des images (QR code)
    const pdfContent = pdfBuffer.toString('utf8');
    expect(pdfContent).toContain('/Image');
  });
});
