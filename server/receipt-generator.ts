import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface ReceiptData {
  receiptNumber: string;
  date: Date;
  merchantName: string;
  merchantEmail: string;
  businessName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  transactionId?: string;
  cooperativeName: string;
}

/**
 * Génère un reçu PDF pour un paiement de commande groupée
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête avec logo et titre
      doc
        .fontSize(24)
        .fillColor('#FF6B35')
        .text('REÇU DE PAIEMENT', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .fillColor('#666')
        .text('Commande Groupée - IFN Connect', { align: 'center' })
        .moveDown(1.5);

      // Ligne de séparation
      doc
        .strokeColor('#FF6B35')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(1);

      // Informations du reçu
      const startY = doc.y;
      doc.fontSize(10).fillColor('#333');

      // Colonne gauche
      doc
        .font('Helvetica-Bold')
        .text('Numéro de reçu:', 50, startY)
        .font('Helvetica')
        .text(data.receiptNumber, 150, startY);

      doc
        .font('Helvetica-Bold')
        .text('Date:', 50, startY + 20)
        .font('Helvetica')
        .text(data.date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }), 150, startY + 20);

      // Colonne droite
      doc
        .font('Helvetica-Bold')
        .text('Coopérative:', 320, startY)
        .font('Helvetica')
        .text(data.cooperativeName, 420, startY);

      doc.moveDown(3);

      // Section Participant
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#FF6B35')
        .text('PARTICIPANT', 50)
        .moveDown(0.5);

      doc.fontSize(10).fillColor('#333').font('Helvetica');
      doc.text(`Nom: ${data.merchantName}`);
      doc.text(`Commerce: ${data.businessName}`);
      doc.text(`Email: ${data.merchantEmail}`);
      doc.moveDown(1.5);

      // Section Détails de la commande
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#FF6B35')
        .text('DÉTAILS DE LA COMMANDE', 50)
        .moveDown(0.5);

      // Tableau des détails
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 250;
      const col3 = 350;
      const col4 = 450;

      // En-tête du tableau
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#FFF')
        .rect(col1, tableTop, 495, 25)
        .fill('#FF6B35');

      doc
        .fillColor('#FFF')
        .text('Produit', col1 + 5, tableTop + 8)
        .text('Quantité', col2 + 5, tableTop + 8)
        .text('Prix unitaire', col3 + 5, tableTop + 8)
        .text('Total', col4 + 5, tableTop + 8);

      // Ligne de données
      const rowY = tableTop + 25;
      doc
        .font('Helvetica')
        .fillColor('#333')
        .text(data.productName, col1 + 5, rowY + 8, { width: 190 })
        .text(data.quantity.toString(), col2 + 5, rowY + 8)
        .text(`${data.unitPrice.toLocaleString('fr-FR')} FCFA`, col3 + 5, rowY + 8)
        .text(`${data.totalAmount.toLocaleString('fr-FR')} FCFA`, col4 + 5, rowY + 8);

      // Bordures du tableau
      doc
        .strokeColor('#DDD')
        .lineWidth(1)
        .rect(col1, tableTop, 495, 50)
        .stroke();

      doc.moveDown(3);

      // Section Paiement
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#FF6B35')
        .text('INFORMATIONS DE PAIEMENT', 50)
        .moveDown(0.5);

      doc.fontSize(10).fillColor('#333').font('Helvetica');
      doc.text(`Méthode de paiement: ${getPaymentMethodLabel(data.paymentMethod)}`);
      if (data.transactionId) {
        doc.text(`Numéro de transaction: ${data.transactionId}`);
      }
      doc.moveDown(1);

      // Montant total en évidence
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#FF6B35')
        .text(`MONTANT PAYÉ: ${data.totalAmount.toLocaleString('fr-FR')} FCFA`, { align: 'right' })
        .moveDown(2);

      // Note de bas de page
      doc
        .fontSize(9)
        .fillColor('#999')
        .font('Helvetica-Oblique')
        .text(
          'Ce reçu confirme votre participation à la commande groupée. ' +
          'Conservez-le pour vos archives comptables.',
          50,
          doc.page.height - 100,
          { align: 'center', width: 495 }
        );

      // Ligne de séparation finale
      doc
        .strokeColor('#DDD')
        .lineWidth(1)
        .moveTo(50, doc.page.height - 70)
        .lineTo(545, doc.page.height - 70)
        .stroke();

      doc
        .fontSize(8)
        .fillColor('#999')
        .text(
          'IFN Connect - Plateforme Nationale des Acteurs du Vivrier Marchand',
          50,
          doc.page.height - 50,
          { align: 'center', width: 495 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Espèces',
    mobile_money: 'Mobile Money',
    bank_transfer: 'Virement bancaire',
    check: 'Chèque',
  };
  return labels[method] || method;
}
