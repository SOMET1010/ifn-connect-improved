import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from './_core/env';

describe('InTouch Webhook Endpoint', () => {
  let baseUrl: string;

  beforeAll(() => {
    // L'URL du serveur de dev
    baseUrl = 'http://localhost:3000';
  });

  it('devrait rejeter un payload invalide', async () => {
    const response = await fetch(`${baseUrl}/api/intouch/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Payload invalide (manque des champs requis)
        invalid: 'data',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('invalide');
  });

  it('devrait rejeter un ID de transaction non reconnu', async () => {
    const response = await fetch(`${baseUrl}/api/intouch/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idFromClient: 'INVALID-20250126-001', // Ne commence pas par CNPS- ou CMU-
        idFromGU: 'GU123456',
        status: 'SUCCESSFUL',
        message: 'Paiement réussi',
        amount: 10000,
        fees: 100,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('non reconnu');
  });

  it('devrait accepter un callback CNPS valide', async () => {
    const response = await fetch(`${baseUrl}/api/intouch/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idFromClient: 'CNPS-TEST-' + Date.now(),
        idFromGU: 'GU' + Date.now(),
        status: 'SUCCESSFUL',
        message: 'Paiement réussi',
        amount: 10000,
        fees: 100,
      }),
    });

    // Le callback devrait être accepté même si la transaction n'existe pas
    // (l'endpoint ne devrait pas échouer)
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('devrait accepter un callback CMU valide', async () => {
    const response = await fetch(`${baseUrl}/api/intouch/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idFromClient: 'CMU-TEST-' + Date.now(),
        idFromGU: 'GU' + Date.now(),
        status: 'FAILED',
        message: 'Paiement échoué',
        amount: 5000,
        fees: 50,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('devrait gérer les statuts SUCCESSFUL et FAILED', async () => {
    const testCases = [
      { status: 'SUCCESSFUL', expectedDbStatus: 'completed' },
      { status: 'FAILED', expectedDbStatus: 'failed' },
    ];

    for (const testCase of testCases) {
      const response = await fetch(`${baseUrl}/api/intouch/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idFromClient: `CNPS-TEST-${testCase.status}-${Date.now()}`,
          idFromGU: 'GU' + Date.now(),
          status: testCase.status,
          message: `Test ${testCase.status}`,
          amount: 10000,
          fees: 100,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe(testCase.expectedDbStatus);
    }
  });
});
