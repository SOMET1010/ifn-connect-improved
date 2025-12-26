import { ENV } from './_core/env';

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

interface SendReceiptEmailParams {
  to: string;
  merchantName: string;
  productName: string;
  amount: number;
  receiptNumber: string;
  pdfBuffer: Buffer;
}

/**
 * Envoie un email de confirmation de paiement avec le reçu PDF en pièce jointe
 */
export async function sendReceiptEmail(params: SendReceiptEmailParams): Promise<boolean> {
  try {
    const { to, merchantName, productName, amount, receiptNumber, pdfBuffer } = params;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.resendApiKey}`,
      },
      body: JSON.stringify({
        from: ENV.resendFromEmail,
        to: [to],
        subject: `✅ Reçu de paiement - Commande groupée ${productName}`,
        html: generateEmailHTML(merchantName, productName, amount, receiptNumber),
        attachments: [
          {
            filename: `recu-${receiptNumber}.pdf`,
            content: pdfBuffer.toString('base64'),
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return false;
    }

    const data = await response.json();
    console.log('Email envoyé avec succès:', data);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
}

/**
 * Génère le contenu HTML de l'email de confirmation
 */
function generateEmailHTML(
  merchantName: string,
  productName: string,
  amount: number,
  receiptNumber: string
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reçu de paiement</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- En-tête -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ✅ Paiement confirmé !
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                Votre reçu de paiement est prêt
              </p>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${merchantName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Nous confirmons la réception de votre paiement pour la commande groupée <strong>${productName}</strong>.
              </p>

              <!-- Carte de résumé -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #FF6B35; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                          Numéro de reçu
                        </td>
                        <td align="right" style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold;">
                          ${receiptNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                          Produit
                        </td>
                        <td align="right" style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold;">
                          ${productName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #dee2e6; color: #666; font-size: 16px; font-weight: bold;">
                          Montant payé
                        </td>
                        <td align="right" style="padding: 8px 0; border-top: 1px solid #dee2e6; color: #FF6B35; font-size: 20px; font-weight: bold;">
                          ${amount.toLocaleString('fr-FR')} FCFA
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                📎 Vous trouverez votre reçu de paiement en pièce jointe de cet email. Conservez-le pour vos archives comptables.
              </p>

              <p style="margin: 0 0 20px 0; color: #666; font-size: 14px; line-height: 1.6;">
                Le créateur de la commande groupée pourra confirmer la commande une fois que tous les participants auront effectué leur paiement.
              </p>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                <strong>IFN Connect</strong><br>
                Plateforme Nationale des Acteurs du Vivrier Marchand
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
