import { describe, it, expect } from 'vitest';
import { protectionSocialeRouter } from './protection-sociale';

describe('Protection Sociale Router', () => {
  it('devrait avoir les procédures requises', () => {
    // Vérifier que le routeur est défini
    expect(protectionSocialeRouter).toBeDefined();
    expect(typeof protectionSocialeRouter).toBe('object');
    
    console.log('✅ Le routeur Protection Sociale est correctement défini');
  });

  it('devrait avoir la procédure getStatus', () => {
    // @ts-ignore - Accès aux procédures internes pour le test
    const procedures = protectionSocialeRouter._def?.procedures || protectionSocialeRouter;
    
    expect(procedures).toHaveProperty('getStatus');
    expect(typeof procedures.getStatus).toBe('function');
    
    console.log('✅ Procédure getStatus disponible');
  });

  it('devrait avoir la procédure getPaymentHistory', () => {
    // @ts-ignore - Accès aux procédures internes pour le test
    const procedures = protectionSocialeRouter._def?.procedures || protectionSocialeRouter;
    
    expect(procedures).toHaveProperty('getPaymentHistory');
    expect(typeof procedures.getPaymentHistory).toBe('function');
    
    console.log('✅ Procédure getPaymentHistory disponible');
  });

  it('devrait avoir la procédure getStatistics', () => {
    // @ts-ignore - Accès aux procédures internes pour le test
    const procedures = protectionSocialeRouter._def?.procedures || protectionSocialeRouter;
    
    expect(procedures).toHaveProperty('getStatistics');
    expect(typeof procedures.getStatistics).toBe('function');
    
    console.log('✅ Procédure getStatistics disponible');
  });

  it('devrait être exportable pour intégration', () => {
    // Vérifier que le routeur peut être exporté
    expect(protectionSocialeRouter).toBeDefined();
    expect(typeof protectionSocialeRouter).toBe('object');
    
    console.log('✅ Routeur Protection Sociale prêt pour intégration');
  });
});
