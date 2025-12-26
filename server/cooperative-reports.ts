import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

/**
 * Interface pour les données du rapport mensuel
 */
interface MonthlyReportData {
  cooperativeName: string;
  month: string;
  year: number;
  totalRevenue: number;
  totalSavings: number;
  totalOrders: number;
  activeParticipants: number;
  topProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalAmount: number;
  }>;
  trend: Array<{
    month: string;
    orderCount: number;
    totalAmount: number;
  }>;
}

/**
 * Interface pour les données du rapport par produit
 */
interface ProductReportData {
  cooperativeName: string;
  productName: string;
  period: string;
  totalOrders: number;
  totalQuantity: number;
  totalAmount: number;
  averagePrice: number;
  participantsCount: number;
  trend: Array<{
    month: string;
    quantity: number;
    amount: number;
  }>;
}

/**
 * Générer un rapport mensuel PDF
 */
export async function generateMonthlyReport(data: MonthlyReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Rapport Mensuel Coopérative', { align: 'center' });

      doc
        .fontSize(14)
        .font('Helvetica')
        .text(data.cooperativeName, { align: 'center' });

      doc
        .fontSize(12)
        .fillColor('#666666')
        .text(`${data.month} ${data.year}`, { align: 'center' });

      doc.moveDown(2);

      // Ligne de séparation
      doc
        .strokeColor('#E67E22')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc.moveDown(1);

      // Section KPIs
      doc
        .fontSize(16)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('📊 Indicateurs Clés de Performance');

      doc.moveDown(0.5);

      const kpiY = doc.y;
      const colWidth = 120;

      // KPI 1: Chiffre d'affaires
      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Chiffre d\'affaires', 50, kpiY);
      doc
        .fontSize(18)
        .fillColor('#10B981')
        .font('Helvetica-Bold')
        .text(`${Math.round(data.totalRevenue).toLocaleString()} FCFA`, 50, kpiY + 15);

      // KPI 2: Économies
      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Économies réalisées', 50 + colWidth, kpiY);
      doc
        .fontSize(18)
        .fillColor('#F59E0B')
        .font('Helvetica-Bold')
        .text(`${Math.round(data.totalSavings).toLocaleString()} FCFA`, 50 + colWidth, kpiY + 15);

      // KPI 3: Commandes
      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Total commandes', 50 + colWidth * 2, kpiY);
      doc
        .fontSize(18)
        .fillColor('#6366F1')
        .font('Helvetica-Bold')
        .text(data.totalOrders.toString(), 50 + colWidth * 2, kpiY + 15);

      // KPI 4: Participants
      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Participants actifs', 50 + colWidth * 3, kpiY);
      doc
        .fontSize(18)
        .fillColor('#3B82F6')
        .font('Helvetica-Bold')
        .text(data.activeParticipants.toString(), 50 + colWidth * 3, kpiY + 15);

      doc.y = kpiY + 50;
      doc.moveDown(1);

      // Section Top Produits
      doc
        .fontSize(16)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('🏆 Top 5 Produits');

      doc.moveDown(0.5);

      // En-tête du tableau
      const tableTop = doc.y;
      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica-Bold')
        .text('Produit', 50, tableTop)
        .text('Quantité', 300, tableTop, { width: 100, align: 'right' })
        .text('Montant (FCFA)', 420, tableTop, { width: 125, align: 'right' });

      doc.moveDown(0.3);

      // Ligne de séparation
      doc
        .strokeColor('#CCCCCC')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc.moveDown(0.3);

      // Lignes du tableau
      data.topProducts.forEach((product, index) => {
        const rowY = doc.y;
        doc
          .fontSize(10)
          .fillColor('#000000')
          .font('Helvetica')
          .text(product.productName, 50, rowY, { width: 240 })
          .text(Math.round(product.totalQuantity).toLocaleString(), 300, rowY, { width: 100, align: 'right' })
          .text(Math.round(product.totalAmount).toLocaleString(), 420, rowY, { width: 125, align: 'right' });

        doc.moveDown(0.5);
      });

      doc.moveDown(1);

      // Section Tendances
      doc
        .fontSize(16)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('📈 Évolution des Commandes');

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Les 6 derniers mois :');

      doc.moveDown(0.3);

      // Graphique simple en texte (les 6 derniers mois)
      const recentTrend = data.trend.slice(-6);
      recentTrend.forEach((item) => {
        doc
          .fontSize(9)
          .fillColor('#000000')
          .text(`${item.month}: ${item.orderCount} commandes - ${Math.round(item.totalAmount).toLocaleString()} FCFA`);
        doc.moveDown(0.2);
      });

      doc.moveDown(2);

      // Pied de page
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text(
          `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Générer un rapport par produit PDF
 */
export async function generateProductReport(data: ProductReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Rapport Produit', { align: 'center' });

      doc
        .fontSize(14)
        .font('Helvetica')
        .text(data.cooperativeName, { align: 'center' });

      doc
        .fontSize(12)
        .fillColor('#666666')
        .text(data.period, { align: 'center' });

      doc.moveDown(2);

      // Ligne de séparation
      doc
        .strokeColor('#E67E22')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc.moveDown(1);

      // Nom du produit
      doc
        .fontSize(18)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text(`📦 ${data.productName}`);

      doc.moveDown(1);

      // Statistiques du produit
      const statsY = doc.y;
      const colWidth = 130;

      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Total commandes', 50, statsY);
      doc
        .fontSize(16)
        .fillColor('#6366F1')
        .font('Helvetica-Bold')
        .text(data.totalOrders.toString(), 50, statsY + 15);

      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Quantité totale', 50 + colWidth, statsY);
      doc
        .fontSize(16)
        .fillColor('#10B981')
        .font('Helvetica-Bold')
        .text(Math.round(data.totalQuantity).toLocaleString(), 50 + colWidth, statsY + 15);

      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Montant total', 50 + colWidth * 2, statsY);
      doc
        .fontSize(16)
        .fillColor('#F59E0B')
        .font('Helvetica-Bold')
        .text(`${Math.round(data.totalAmount).toLocaleString()} FCFA`, 50 + colWidth * 2, statsY + 15);

      doc.y = statsY + 50;
      doc.moveDown(1);

      // Prix moyen et participants
      doc
        .fontSize(12)
        .fillColor('#000000')
        .font('Helvetica')
        .text(`Prix moyen unitaire: ${Math.round(data.averagePrice).toLocaleString()} FCFA`);

      doc
        .fontSize(12)
        .text(`Nombre de participants: ${data.participantsCount}`);

      doc.moveDown(2);

      // Section Tendances
      doc
        .fontSize(16)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('📈 Évolution Mensuelle');

      doc.moveDown(0.5);

      // En-tête du tableau
      const tableTop = doc.y;
      doc
        .fontSize(10)
        .fillColor('#666666')
        .font('Helvetica-Bold')
        .text('Mois', 50, tableTop)
        .text('Quantité', 300, tableTop, { width: 100, align: 'right' })
        .text('Montant (FCFA)', 420, tableTop, { width: 125, align: 'right' });

      doc.moveDown(0.3);

      // Ligne de séparation
      doc
        .strokeColor('#CCCCCC')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc.moveDown(0.3);

      // Lignes du tableau
      data.trend.forEach((item) => {
        const rowY = doc.y;
        doc
          .fontSize(10)
          .fillColor('#000000')
          .font('Helvetica')
          .text(item.month, 50, rowY)
          .text(Math.round(item.quantity).toLocaleString(), 300, rowY, { width: 100, align: 'right' })
          .text(Math.round(item.amount).toLocaleString(), 420, rowY, { width: 125, align: 'right' });

        doc.moveDown(0.5);
      });

      doc.moveDown(2);

      // Pied de page
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text(
          `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
