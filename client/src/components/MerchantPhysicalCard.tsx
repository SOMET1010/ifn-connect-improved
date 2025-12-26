import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';

interface MerchantData {
  id: number;
  merchantNumber: string;
  name: string;
  cooperative?: string;
  category?: 'A' | 'B' | 'C';
  identifiantCarte?: string;
  marche?: string;
}

interface Props {
  merchant: MerchantData;
}

export default function MerchantPhysicalCard({ merchant }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Format carte bancaire: 85.6mm x 53.98mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      
      // Ajouter le verso sur une nouvelle page
      pdf.addPage([85.6, 53.98], 'landscape');
      
      pdf.save(`PNAVIM-${merchant.merchantNumber}-carte.pdf`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
  };

  const qrCodeData = `https://pnavim.ci/merchant/${merchant.id}`;

  return (
    <div className="space-y-4">
      {/* Bouton export */}
      <div className="flex justify-end">
        <Button onClick={handleExportPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Télécharger Carte PDF
        </Button>
      </div>

      {/* Cartes */}
      <div ref={cardRef} className="space-y-8">
        {/* RECTO */}
        <div
          className="relative bg-white rounded-2xl shadow-2xl overflow-hidden mx-auto"
          style={{
            width: '85.6mm',
            height: '53.98mm',
            backgroundImage: 'linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 100%)',
          }}
        >
          {/* Header vert */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Logo */}
              <div className="bg-white rounded-full p-1">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  P
                </div>
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">PNAVIM-CI</p>
                <p className="text-[8px] leading-tight opacity-90">
                  PLATEFORME NATIONALE DES ACTEURS
                </p>
                <p className="text-[8px] leading-tight opacity-90">
                  DU VIVRIER MARCHAND, CÔTE D'IVOIRE
                </p>
              </div>
            </div>

            {/* Badge catégorie */}
            <div className="bg-white text-green-700 rounded-full w-10 h-10 flex items-center justify-center">
              <span className="text-2xl font-bold">{merchant.category || 'A'}</span>
            </div>
          </div>

          {/* Bande orange décorative */}
          <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />

          {/* Contenu principal */}
          <div className="p-4 space-y-2">
            <div className="bg-green-700 text-white px-3 py-1 rounded-lg">
              <p className="text-xs font-bold">CARTE ACTEUR DU VIVRIER MARCHAND</p>
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">
                {merchant.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-600 font-semibold">Marché:</p>
                <p className="font-bold text-gray-900">{merchant.marche || merchant.cooperative || 'COCOVICO'}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Catégorie:</p>
                <p className="font-bold text-2xl text-green-700">{merchant.category || 'A'}</p>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <div>
                  <p className="text-[10px] text-gray-600">Identifiant Carte:</p>
                  <p className="text-sm font-bold text-gray-900">{merchant.identifiantCarte || '0000467A'}</p>
                </div>
                <div className="bg-orange-500 text-white px-2 py-1 rounded">
                  <p className="text-[9px] font-semibold">N°ID Plateforme:</p>
                  <p className="text-xs font-bold">{merchant.merchantNumber}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white p-1 rounded shadow-md">
                <QRCodeSVG value={qrCodeData} size={60} />
              </div>
            </div>
          </div>
        </div>

        {/* VERSO */}
        <div
          className="relative bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden mx-auto"
          style={{
            width: '85.6mm',
            height: '53.98mm',
          }}
        >
          {/* Motif décoratif */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500 rounded-full translate-y-12 -translate-x-12" />
          </div>

          <div className="relative h-full flex flex-col justify-between p-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold">Carte officielle - Programme National</p>
                <p className="text-xs opacity-80">Vérification par QR Code</p>
              </div>

              <div className="h-px bg-white/20" />

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1 rounded">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <p>Contact : support@pnavim.ci</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1 rounded">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <p>Hotline : 27 20 30 40 50</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] opacity-60">PNAVIM-CI - Tous droits réservés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
