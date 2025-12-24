import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Merchant } from '../drizzle/schema';

interface CertificateData {
  merchant: Merchant;
  level: string;
  levelColor: string;
  badgesCount: number;
  totalSales: number;
  enrollmentDate: Date;
}

/**
 * Génère un certificat professionnel PDF pour un marchand
 */
export async function generateCertificate(data: CertificateData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const { merchant, level, badgesCount, totalSales, enrollmentDate } = data;

      // Couleurs
      const primaryColor = '#FF6B35'; // Orange IFN Connect
      const secondaryColor = '#2ECC71'; // Vert
      const textColor = '#2C3E50';
      const lightGray = '#ECF0F1';

      // ============================================================================
      // EN-TÊTE
      // ============================================================================
      
      // Bordure décorative en haut
      doc
        .rect(0, 0, doc.page.width, 20)
        .fill(primaryColor);

      // Titre principal
      doc
        .fontSize(32)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('CERTIFICAT PROFESSIONNEL', 50, 60, { align: 'center' });

      doc
        .fontSize(16)
        .fillColor(textColor)
        .font('Helvetica')
        .text('PLATEFORME D\'INCLUSION NUMÉRIQUE', 50, 100, { align: 'center' });

      // Ligne séparatrice
      doc
        .moveTo(100, 130)
        .lineTo(doc.page.width - 100, 130)
        .strokeColor(primaryColor)
        .lineWidth(2)
        .stroke();

      // ============================================================================
      // INFORMATIONS PRINCIPALES
      // ============================================================================

      let yPos = 160;

      // Texte d'introduction
      doc
        .fontSize(14)
        .fillColor(textColor)
        .font('Helvetica')
        .text('Le présent certificat atteste que', 50, yPos, { align: 'center' });

      yPos += 40;

      // Nom du marchand (GRAND)
      doc
        .fontSize(28)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text(merchant.businessName || 'Marchand', 50, yPos, { align: 'center' });

      yPos += 50;

      // Code MRC
      doc
        .fontSize(20)
        .fillColor(secondaryColor)
        .font('Helvetica-Bold')
        .text(`Code : ${merchant.merchantNumber}`, 50, yPos, { align: 'center' });

      yPos += 50;

      // Texte descriptif
      doc
        .fontSize(12)
        .fillColor(textColor)
        .font('Helvetica')
        .text(
          'est officiellement enregistré(e) comme marchand(e) professionnel(le)',
          50,
          yPos,
          { align: 'center', width: doc.page.width - 100 }
        );

      yPos += 30;

      doc
        .fontSize(12)
        .text(
          'au sein de la Plateforme d\'Inclusion Financière Numérique de Côte d\'Ivoire',
          50,
          yPos,
          { align: 'center', width: doc.page.width - 100 }
        );

      yPos += 60;

      // ============================================================================
      // DÉTAILS PROFESSIONNELS (Encadré)
      // ============================================================================

      const boxY = yPos;
      const boxHeight = 180;

      // Fond de l'encadré
      doc
        .rect(70, boxY, doc.page.width - 140, boxHeight)
        .fillAndStroke(lightGray, textColor)
        .lineWidth(1);

      yPos = boxY + 20;

      // Titre de la section
      doc
        .fontSize(14)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('INFORMATIONS PROFESSIONNELLES', 90, yPos);

      yPos += 30;

      // Détails en colonnes
      const leftCol = 100;
      const rightCol = 320;
      const lineHeight = 25;

      doc.fontSize(11).fillColor(textColor).font('Helvetica');

      // Colonne gauche
      doc.font('Helvetica-Bold').text('Marché :', leftCol, yPos);
      doc.font('Helvetica').text(merchant.location || 'Non renseigné', leftCol + 80, yPos);

      doc.font('Helvetica-Bold').text('Niveau :', leftCol, yPos + lineHeight);
      doc.font('Helvetica').text(level, leftCol + 80, yPos + lineHeight);

      doc.font('Helvetica-Bold').text('Badges :', leftCol, yPos + lineHeight * 2);
      doc.font('Helvetica').text(`${badgesCount} débloqués`, leftCol + 80, yPos + lineHeight * 2);

      // Colonne droite
      doc.font('Helvetica-Bold').text('Enrôlement :', rightCol, yPos);
      doc
        .font('Helvetica')
        .text(
          enrollmentDate.toLocaleDateString('fr-FR'),
          rightCol + 90,
          yPos
        );

      doc.font('Helvetica-Bold').text('Ventes totales :', rightCol, yPos + lineHeight);
      doc
        .font('Helvetica')
        .text(`${totalSales.toLocaleString()} FCFA`, rightCol + 90, yPos + lineHeight);

      doc.font('Helvetica-Bold').text('CNPS/CMU :', rightCol, yPos + lineHeight * 2);
      doc
        .font('Helvetica')
        .text(
          merchant.cnpsStatus === 'active' && merchant.cmuStatus === 'active'
            ? 'Actifs ✓'
            : 'En cours',
          rightCol + 90,
          yPos + lineHeight * 2
        );

      yPos = boxY + boxHeight + 40;

      // ============================================================================
      // QR CODE
      // ============================================================================

      // Générer le QR code
      const qrData = `https://ifn-connect.ci/verify/${merchant.merchantNumber}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 1,
      });

      // Convertir le data URL en buffer
      const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

      // Positionner le QR code en bas à gauche
      doc.image(qrBuffer, 80, doc.page.height - 150, { width: 80 });

      doc
        .fontSize(9)
        .fillColor(textColor)
        .font('Helvetica')
        .text('Scannez pour vérifier', 70, doc.page.height - 60, {
          width: 100,
          align: 'center',
        });

      // ============================================================================
      // SIGNATURE ET DATE
      // ============================================================================

      const signatureY = doc.page.height - 150;

      // Date d'émission
      doc
        .fontSize(11)
        .fillColor(textColor)
        .font('Helvetica')
        .text(`Émis le ${new Date().toLocaleDateString('fr-FR')}`, 200, signatureY, {
          align: 'center',
          width: 300,
        });

      // Ligne de signature
      doc
        .moveTo(250, signatureY + 60)
        .lineTo(450, signatureY + 60)
        .strokeColor(textColor)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(10)
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .text('Direction Générale de l\'Économie', 200, signatureY + 70, {
          align: 'center',
          width: 300,
        });

      doc
        .fontSize(9)
        .font('Helvetica')
        .text('République de Côte d\'Ivoire', 200, signatureY + 90, {
          align: 'center',
          width: 300,
        });

      // ============================================================================
      // PIED DE PAGE
      // ============================================================================

      // Bordure décorative en bas
      doc
        .rect(0, doc.page.height - 20, doc.page.width, 20)
        .fill(primaryColor);

      // Finaliser le PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
