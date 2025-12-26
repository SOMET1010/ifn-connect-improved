import { Resend } from 'resend';

/**
 * Service d'envoi d'emails avec Resend
 * 
 * Configuration requise :
 * - Variable d'environnement RESEND_API_KEY
 * - Variable d'environnement RESEND_FROM_EMAIL (email vérifié dans Resend)
 */

// Initialiser Resend avec la clé API
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PNAVIM-CI <noreply@pnavim-ci.org>';

let resend: Resend | null = null;

if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
  console.log('[Email] Resend initialized');
} else {
  console.warn('[Email] Resend API key not configured - emails will not be sent');
}

/**
 * Interface pour l'envoi d'email
 */
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoyer un email via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!resend) {
    console.warn('[Email] Cannot send email - Resend not configured');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return false;
    }

    console.log(`[Email] Sent to ${options.to}: ${options.subject} (ID: ${data?.id})`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

/**
 * Envoyer un email d'alerte d'expiration de couverture sociale
 */
export async function sendExpirationAlert(params: {
  to: string;
  merchantName: string;
  protectionType: 'CNPS' | 'CMU' | 'RSTI';
  expiryDate: Date;
  daysRemaining: number;
}): Promise<boolean> {
  const { to, merchantName, protectionType, expiryDate, daysRemaining } = params;

  const protectionNames = {
    CNPS: 'CNPS (Retraite)',
    CMU: 'CMU (Couverture Maladie Universelle)',
    RSTI: 'RSTI (Régime Social des Travailleurs Indépendants)',
  };

  const urgencyLevel = daysRemaining <= 1 ? 'critique' : daysRemaining <= 7 ? 'urgente' : 'importante';
  const urgencyColor = daysRemaining <= 1 ? '#dc2626' : daysRemaining <= 7 ? '#f97316' : '#f59e0b';

  const formattedDate = expiryDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subject = `⚠️ Alerte ${urgencyLevel} : Votre ${protectionType} expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ⚠️ Alerte d'Expiration
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                Votre couverture sociale nécessite votre attention
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Bonjour <strong>${merchantName}</strong>,
              </p>

              <div style="background-color: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: ${urgencyColor};">
                  ${protectionNames[protectionType]}
                </p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">
                  Expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}
                </p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                  Date d'expiration : ${formattedDate}
                </p>
              </div>

              <p style="margin: 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Pour continuer à bénéficier de votre couverture sociale sans interruption, nous vous invitons à soumettre votre demande de renouvellement <strong>dès maintenant</strong>.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://pnavim-ci.org/merchant/social-protection" 
                   style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Renouveler maintenant
                </a>
              </div>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1f2937;">
                  📋 Documents requis :
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #6b7280; line-height: 1.8;">
                  <li>Justificatif de paiement récent</li>
                  <li>Copie de votre carte d'identité</li>
                  <li>Photo récente</li>
                </ul>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Pour toute question, n'hésitez pas à contacter notre équipe de support.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
                PNAVIM-CI
              </p>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Plateforme Nationale des Acteurs du Vivrier Marchand de Côte d'Ivoire
              </p>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
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
  `;

  const text = `
Bonjour ${merchantName},

Votre ${protectionNames[protectionType]} expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} (${formattedDate}).

Pour continuer à bénéficier de votre couverture sociale sans interruption, veuillez soumettre votre demande de renouvellement dès maintenant sur :
https://pnavim-ci.org/merchant/social-protection

Documents requis :
- Justificatif de paiement récent
- Copie de votre carte d'identité
- Photo récente

Cordialement,
L'équipe PNAVIM-CI
  `;

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}
