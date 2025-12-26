/**
 * InTouch Webhook Endpoint
 * 
 * Reçoit les notifications asynchrones d'InTouch après le traitement d'une transaction.
 * Met à jour le statut des paiements CNPS/CMU dans la base de données.
 * 
 * Endpoint: POST /api/intouch/callback
 * 
 * Documentation: https://developers.intouchgroup.net/
 */

import { Router, Request, Response } from 'express';
import { validerCallbackInTouch, InTouchCallbackPayload } from '../_core/intouch';
import { getDb } from '../db';
import { cnpsPayments, cmuReimbursements } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Webhook InTouch - Reçoit les notifications de paiement
 * 
 * POST /api/intouch/callback
 * 
 * Body: InTouchCallbackPayload
 * {
 *   idFromClient: string,    // ID de transaction (ex: CNPS-20250126-001)
 *   idFromGU: string,         // ID InTouch
 *   status: 'SUCCESSFUL' | 'FAILED',
 *   message: string,
 *   amount: number,
 *   fees: number
 * }
 */
router.post('/api/intouch/callback', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection unavailable',
      });
    }

    console.log('[InTouch Webhook] Callback reçu:', JSON.stringify(req.body, null, 2));

    // Valider le payload du callback
    let payload: InTouchCallbackPayload;
    try {
      payload = validerCallbackInTouch(req.body);
    } catch (error) {
      console.error('[InTouch Webhook] Payload invalide:', error);
      return res.status(400).json({
        success: false,
        message: 'Payload de callback invalide',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }

    const { idFromClient, idFromGU, status, message, amount, fees } = payload;

    // Déterminer le type de transaction (CNPS ou CMU) depuis l'ID
    const isCNPS = idFromClient.startsWith('CNPS-');
    const isCMU = idFromClient.startsWith('CMU-');

    if (!isCNPS && !isCMU) {
      console.error('[InTouch Webhook] ID de transaction non reconnu:', idFromClient);
      return res.status(400).json({
        success: false,
        message: 'ID de transaction non reconnu (doit commencer par CNPS- ou CMU-)',
      });
    }

    // Mapper le statut InTouch vers notre schéma
    const dbStatus = status === 'SUCCESSFUL' ? 'completed' : 'failed';

    // Mettre à jour la transaction dans la base de données
    if (isCNPS) {
      // Mettre à jour le paiement CNPS
      const result = await db
        .update(cnpsPayments)
        .set({
          status: dbStatus,
          transactionId: idFromGU, // Sauvegarder l'ID InTouch
          updatedAt: new Date(),
        })
        .where(eq(cnpsPayments.transactionId, idFromClient));

      console.log('[InTouch Webhook] Paiement CNPS mis à jour:', {
        transactionId: idFromClient,
        status: dbStatus,
        idFromGU,
      });

      // Si le paiement est réussi, mettre à jour la date d'expiration du marchand
      if (status === 'SUCCESSFUL') {
        // Récupérer le paiement pour obtenir le merchantId
        const [payment] = await db.select().from(cnpsPayments).where(eq(cnpsPayments.transactionId, idFromClient)).limit(1);
        
        if (payment) {
          const { merchants } = await import('../../drizzle/schema');
          
          // Ajouter 12 mois à la date d'expiration actuelle
          const newExpiryDate = new Date();
          newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

          await db
            .update(merchants)
            .set({
              cnpsExpiryDate: newExpiryDate,
              cnpsStatus: 'active',
            })
            .where(eq(merchants.id, payment.merchantId));

          console.log('[InTouch Webhook] Date d\'expiration CNPS mise à jour:', {
            merchantId: payment.merchantId,
            newExpiryDate,
          });
        }
      }
    } else if (isCMU) {
      // Mettre à jour le remboursement CMU
      const result = await db
        .update(cmuReimbursements)
        .set({
          status: dbStatus === 'completed' ? 'approved' : 'rejected',
          transactionId: idFromGU,
          updatedAt: new Date(),
        })
        .where(eq(cmuReimbursements.transactionId, idFromClient));

      console.log('[InTouch Webhook] Remboursement CMU mis à jour:', {
        transactionId: idFromClient,
        status: dbStatus,
        idFromGU,
      });

      // Si le paiement est réussi, mettre à jour la date d'expiration du marchand
      if (status === 'SUCCESSFUL') {
        // Récupérer le remboursement pour obtenir le merchantId
        const [reimbursement] = await db.select().from(cmuReimbursements).where(eq(cmuReimbursements.transactionId, idFromClient)).limit(1);
        
        if (reimbursement) {
          const { merchants } = await import('../../drizzle/schema');
          
          // Ajouter 12 mois à la date d'expiration actuelle
          const newExpiryDate = new Date();
          newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

          await db
            .update(merchants)
            .set({
              cmuExpiryDate: newExpiryDate,
              cmuStatus: 'active',
            })
            .where(eq(merchants.id, reimbursement.merchantId));

          console.log('[InTouch Webhook] Date d\'expiration CMU mise à jour:', {
            merchantId: reimbursement.merchantId,
            newExpiryDate,
          });
        }
      }
    }

    // Répondre avec succès
    return res.status(200).json({
      success: true,
      message: 'Callback traité avec succès',
      transactionId: idFromClient,
      status: dbStatus,
    });
  } catch (error) {
    console.error('[InTouch Webhook] Erreur lors du traitement du callback:', error);
    
    // Répondre avec erreur 500
    return res.status(500).json({
      success: false,
      message: 'Erreur interne lors du traitement du callback',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
});

export default router;
