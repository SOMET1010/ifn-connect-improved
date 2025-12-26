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
  phone?: string;
  phoneUrgence?: string;
  dateNaissance?: string;
  nationalite?: string;
  photo?: string;
  cooperative?: string;
  category?: 'A' | 'B' | 'C';
  produits?: string;
  secteur?: string;
  nbMagasins?: number;
  numeroTable?: string;
  box?: string;
  situationMatrimoniale?: string;
  nbEnfants?: number;
  lieuResidence?: string;
  cni?: string;
  cmu?: string;
  cnps?: string;
  identifiantCarte?: string;
  marche?: string;
}

interface Props {
  merchant: MerchantData;
}

export default function MerchantIdentificationCard({ merchant }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`PNAVIM-${merchant.merchantNumber}-fiche.pdf`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
  };

  // Générer l'URL du QR Code (lien vers la fiche en ligne)
  const qrCodeData = `https://pnavim.ci/merchant/${merchant.id}`;

  return (
    <div className="space-y-4">
      {/* Bouton export */}
      <div className="flex justify-end">
        <Button onClick={handleExportPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Télécharger PDF
        </Button>
      </div>

      {/* Fiche A4 */}
      <div
        ref={cardRef}
        className="bg-white w-[210mm] mx-auto p-8 shadow-lg"
        style={{ minHeight: '297mm' }}
      >
        {/* Header vert avec logo et badge catégorie */}
        <div className="relative bg-gradient-to-r from-green-700 to-green-600 text-white p-6 rounded-t-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo PNAVIM-CI */}
              <div className="bg-white rounded-full p-3">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  P
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">PNAVIM-CI</h1>
                <p className="text-sm opacity-90">
                  PLATEFORME NATIONALE DES ACTEURS
                </p>
                <p className="text-sm opacity-90">
                  DU VIVRIER MARCHAND, CÔTE D'IVOIRE
                </p>
              </div>
            </div>

            {/* Badge catégorie */}
            <div className="bg-white text-green-700 rounded-full w-24 h-24 flex items-center justify-center">
              <span className="text-5xl font-bold">
                {merchant.category || 'A'}
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold">
              FICHE D'IDENTIFICATION
            </h2>
            <p className="text-lg">ACTEUR DU VIVRIER MARCHAND</p>
          </div>
        </div>

        {/* Section Identité */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Photo */}
          <div className="col-span-1">
            <div className="border-4 border-gray-300 rounded-lg overflow-hidden aspect-[3/4] bg-gray-100">
              {merchant.photo ? (
                <img
                  src={merchant.photo}
                  alt={merchant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Photo
                </div>
              )}
            </div>
          </div>

          {/* Informations identité */}
          <div className="col-span-2 space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-600">Nom:</p>
                <p className="text-lg font-bold">{merchant.name.split(' ')[0] || ''}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Prénoms:</p>
                <p className="text-lg font-bold">{merchant.name.split(' ').slice(1).join(' ') || ''}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Date de naissance:</p>
                <p className="text-lg">{merchant.dateNaissance || '___/___/______'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Nationalité:</p>
                <p className="text-lg">{merchant.nationalite || 'Ivoirienne'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Téléphone:</p>
                <p className="text-lg font-mono">{merchant.phone || '__ __ __ __ __'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Tél. Urgence:</p>
                <p className="text-lg font-mono">{merchant.phoneUrgence || '__ __ __ __ __'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Activité Commerciale */}
        <div className="mb-6">
          <div className="bg-green-700 text-white px-4 py-2 rounded-t-lg">
            <h3 className="text-lg font-bold">Activité Commerciale</h3>
          </div>
          <div className="bg-green-50 p-4 rounded-b-lg space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-600">Produits:</p>
              <p className="text-base">{merchant.produits || 'Riz, Manioc, Banane'}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Secteur:</p>
                <p className="text-base">{merchant.secteur || 'Grossiste | Semi-grossiste | Détaillant'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Nb Magasins:</p>
                <p className="text-base">{merchant.nbMagasins || '___'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Table:</p>
                  <p className="text-base">{merchant.numeroTable || '___'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Box:</p>
                  <p className="text-base">{merchant.box || '___'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Situation Sociale */}
        <div className="mb-6">
          <div className="bg-green-700 text-white px-4 py-2 rounded-t-lg">
            <h3 className="text-lg font-bold">Situation Sociale</h3>
          </div>
          <div className="bg-green-50 p-4 rounded-b-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Matrimoniale:</p>
                <p className="text-base">{merchant.situationMatrimoniale || '___________'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Enfants:</p>
                <p className="text-base">{merchant.nbEnfants || '___'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-semibold text-gray-600">Lieu de Résidence:</p>
                <p className="text-base">{merchant.lieuResidence || '_________________________________'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Identifiants */}
        <div className="mb-6">
          <div className="bg-green-700 text-white px-4 py-2 rounded-t-lg">
            <h3 className="text-lg font-bold">Identifiants</h3>
          </div>
          <div className="bg-green-50 p-4 rounded-b-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-600">N° CNI:</p>
                  <p className="text-base font-mono">{merchant.cni || '___________________'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">N° CMU:</p>
                  <p className="text-base font-mono">{merchant.cmu || '___________________'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">N° CNPS:</p>
                  <p className="text-base font-mono">{merchant.cnps || '___________________'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Identifiant Carte:</p>
                  <p className="text-xl font-bold">{merchant.identifiantCarte || '0000467A'}</p>
                </div>
                <div className="bg-orange-500 text-white px-4 py-2 rounded-lg">
                  <p className="text-sm font-semibold">N°ID Plateforme:</p>
                  <p className="text-xl font-bold">{merchant.merchantNumber}</p>
                </div>
              </div>

              {/* QR Code + Signature */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <QRCodeSVG value={qrCodeData} size={150} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 italic">Signature</p>
                  <div className="h-16 border-b-2 border-gray-400 w-48" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-8">
          <p>Fait à {merchant.marche || 'Abidjan'}, le {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
}
