import { describe, it, expect } from 'vitest';
import { ENV } from './_core/env';

describe('InTouch API Integration', () => {
  it('devrait avoir tous les credentials InTouch configurés', () => {
    // Vérifier que toutes les variables d'environnement sont présentes
    expect(ENV.INTOUCH_PARTNER_ID).toBe('CI300373');
    expect(ENV.INTOUCH_LOGIN_API).toBe('07084598370');
    expect(ENV.INTOUCH_USERNAME).toBeTruthy();
    expect(ENV.INTOUCH_USERNAME.length).toBeGreaterThan(0);
    expect(ENV.INTOUCH_PASSWORD).toBeTruthy();
    expect(ENV.INTOUCH_PASSWORD.length).toBeGreaterThan(0);
    expect(ENV.INTOUCH_PASSWORD_API).toBe('SK7VHnkZvc');
    expect(ENV.INTOUCH_BASE_URL).toBe('https://apidist.gutouch.net');
    expect(ENV.INTOUCH_SERVICE_CODE).toBe('PAIEMENTMARCHANDOMPAYCIDIRECT');
    
    console.log('✅ Tous les credentials InTouch sont configurés correctement');
  });

  it('devrait générer des IDs de transaction uniques', async () => {
    const { genererIdTransactionInTouch } = await import('./_core/intouch');
    
    const id1 = genererIdTransactionInTouch('CNPS');
    const id2 = genererIdTransactionInTouch('CMU');
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^CNPS-\d{14}-[A-Z0-9]{4}$/);
    expect(id2).toMatch(/^CMU-\d{14}-[A-Z0-9]{4}$/);
  });
});
