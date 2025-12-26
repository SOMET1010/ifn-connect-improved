import { QRCodeSVG } from 'qrcode.react';
import { Download, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface MerchantIDCardProps {
  merchant: {
    id: number;
    merchantCode: string;
    fullName: string;
    phone: string;
    marketId: number | null;
    photoUrl: string | null;
    socialProtection: {
      hasCNPS: boolean;
      cnpsNumber: string | null;
      hasCMU: boolean;
      cmuNumber: string | null;
    } | null;
  };
  level?: string;
  levelColor?: string;
}

export function MerchantIDCard({ merchant, level = 'Débutant', levelColor = 'bg-gray-500' }: MerchantIDCardProps) {
  
  // Données encodées dans le QR code (format JSON)
  const qrData = JSON.stringify({
    code: merchant.merchantCode,
    name: merchant.fullName,
    phone: merchant.phone,
    cnps: merchant.socialProtection?.cnpsNumber || 'N/A',
    cmu: merchant.socialProtection?.cmuNumber || 'N/A',
  });

  // Télécharger la carte d'identité (capture d'écran)
  const handleDownload = async () => {
    try {
      const cardElement = document.getElementById('merchant-id-card');
      if (!cardElement) {
        toast.error('Impossible de capturer la carte');
        return;
      }

      // Utiliser html2canvas pour capturer l'élément
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Haute résolution
      });

      // Convertir en blob et télécharger
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Erreur lors de la génération de l\'image');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `carte-marchand-${merchant.merchantCode}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Carte d\'identité téléchargée !');
      });
    } catch (error) {
      console.error('Erreur téléchargement carte:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Carte d'identité principale */}
      <div
        id="merchant-id-card"
        className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl shadow-2xl overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '600px',
          aspectRatio: '1.586', // Format carte bancaire (85.6mm x 53.98mm)
        }}
      >
        {/* Motif de fond */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo République de Côte d'Ivoire (coin supérieur gauche) */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-orange-600 font-bold text-xl">CI</span>
          </div>
          <div className="text-white">
            <p className="text-xs font-semibold leading-tight">République de</p>
            <p className="text-xs font-bold leading-tight">Côte d'Ivoire</p>
          </div>
        </div>

        {/* Badge niveau (coin supérieur droit) */}
        <div className="absolute top-4 right-4">
          <div className={`${levelColor} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}>
            <Shield className="h-4 w-4" />
            <span className="text-sm font-bold">{level}</span>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="relative h-full flex items-center px-8 py-6">
          <div className="flex-1 space-y-4">
            {/* Photo de profil */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-white shadow-xl overflow-hidden border-4 border-white">
                  {merchant.photoUrl ? (
                    <img
                      src={merchant.photoUrl}
                      alt={merchant.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">
                        {merchant.fullName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations principales */}
              <div className="flex-1 text-white">
                <h2 className="text-2xl font-bold mb-1">{merchant.fullName}</h2>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <p className="text-xl font-mono font-bold tracking-wider">{merchant.merchantCode}</p>
                </div>
                <p className="text-sm opacity-90">📱 {merchant.phone}</p>
              </div>
            </div>

            {/* Couverture sociale */}
            <div className="flex gap-4 text-white text-sm">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Shield className="h-4 w-4" />
                <div>
                  <p className="font-semibold">CNPS</p>
                  <p className="font-mono text-xs">
                    {merchant.socialProtection?.hasCNPS && merchant.socialProtection?.cnpsNumber
                      ? merchant.socialProtection.cnpsNumber
                      : 'Non enregistré'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Shield className="h-4 w-4" />
                <div>
                  <p className="font-semibold">CMU</p>
                  <p className="font-mono text-xs">
                    {merchant.socialProtection?.hasCMU && merchant.socialProtection?.cmuNumber
                      ? merchant.socialProtection.cmuNumber
                      : 'Non enregistré'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="ml-6">
            <div className="bg-white p-3 rounded-2xl shadow-xl">
              <QRCodeSVG
                value={qrData}
                size={120}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-white text-xs text-center mt-2 font-semibold">
              Scan pour vérifier
            </p>
          </div>
        </div>

        {/* Bande inférieure */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm py-2 px-8">
          <div className="flex items-center justify-between text-white text-xs">
            <p className="font-semibold">IFN CONNECT - Inclusion Financière Numérique</p>
            <p className="font-mono">ID: {merchant.id.toString().padStart(6, '0')}</p>
          </div>
        </div>
      </div>

      {/* Bouton de téléchargement */}
      <div className="flex justify-center">
        <Button
          onClick={handleDownload}
          size="lg"
          className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
        >
          <Download className="h-5 w-5 mr-2" />
          Télécharger la Carte d'Identité
        </Button>
      </div>

      {/* Informations supplémentaires */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Comment utiliser votre carte d'identité numérique
        </h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <p><strong>Téléchargez</strong> votre carte d'identité et conservez-la dans votre téléphone</p>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <p><strong>Présentez</strong> votre code MRC ou le QR code lors des transactions</p>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <p><strong>Vérifiez</strong> votre couverture sociale (CNPS/CMU) directement sur la carte</p>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <p><strong>Partagez</strong> votre QR code pour faciliter les paiements et les transactions</p>
          </li>
        </ul>
      </Card>
    </div>
  );
}
