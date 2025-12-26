import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  User, 
  FileText, 
  MapPin, 
  Shield, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Loader2
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';

type EnrollmentStep = 1 | 2 | 3 | 4 | 5;

interface EnrollmentData {
  // Étape 1
  fullName: string;
  phone: string;
  dateOfBirth: string;
  
  // Étape 2
  idPhoto: string | null;
  licensePhoto: string | null;
  
  // Étape 3
  latitude: number | null;
  longitude: number | null;
  marketId: number | null;
  
  // Étape 4
  hasCNPS: boolean;
  cnpsNumber: string;
  hasCMU: boolean;
  cmuNumber: string;
}

export default function EnrollmentWizard() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<EnrollmentStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [data, setData] = useState<EnrollmentData>({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    idPhoto: null,
    licensePhoto: null,
    latitude: null,
    longitude: null,
    marketId: null,
    hasCNPS: false,
    cnpsNumber: '',
    hasCMU: false,
    cmuNumber: '',
  });

  // Récupérer la liste des marchés
  const { data: markets } = trpc.markets.list.useQuery();

  // Hooks pour la capture photo
  const idPhotoCapture = usePhotoCapture();
  const licensePhotoCapture = usePhotoCapture();

  // Mutation pour l'enrôlement
  const enrollMutation = trpc.agent.enrollMerchant.useMutation();

  // Mettre à jour les photos dans le state principal
  if (idPhotoCapture.photo && !data.idPhoto) {
    setData({ ...data, idPhoto: idPhotoCapture.photo });
  }
  if (licensePhotoCapture.photo && !data.licensePhoto) {
    setData({ ...data, licensePhoto: licensePhotoCapture.photo });
  }

  const progress = (currentStep / 5) * 100;

  const stepTitles = {
    1: 'Informations Personnelles',
    2: 'Pièces Justificatives',
    3: 'Localisation',
    4: 'Couverture Sociale',
    5: 'Récapitulatif',
  };

  const stepIcons = {
    1: User,
    2: FileText,
    3: MapPin,
    4: Shield,
    5: CheckCircle,
  };

  const handleNext = () => {
    // Validation selon l'étape
    if (currentStep === 1) {
      if (!data.fullName || !data.phone || !data.dateOfBirth) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
      // Validation téléphone ivoirien
      if (!/^[0-9]{10}$/.test(data.phone)) {
        toast.error('Le numéro de téléphone doit contenir 10 chiffres');
        return;
      }
      // Validation âge > 18 ans
      const birthDate = new Date(data.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        toast.error('Le marchand doit avoir au moins 18 ans');
        return;
      }
    }

    if (currentStep === 2) {
      if (!data.idPhoto || !data.licensePhoto) {
        toast.error('Veuillez capturer les deux photos obligatoires');
        return;
      }
    }

    if (currentStep === 3) {
      if (!data.latitude || !data.longitude || !data.marketId) {
        toast.error('Veuillez confirmer votre position et sélectionner un marché');
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as EnrollmentStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as EnrollmentStep);
    }
  };

  const handleSubmit = async () => {
    if (!data.idPhoto || !data.licensePhoto) {
      toast.error('Les photos sont obligatoires');
      return;
    }

    if (!data.latitude || !data.longitude || !data.marketId) {
      toast.error('La localisation est obligatoire');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await enrollMutation.mutateAsync({
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        idPhoto: data.idPhoto,
        licensePhoto: data.licensePhoto,
        latitude: data.latitude,
        longitude: data.longitude,
        marketId: data.marketId,
        hasCNPS: data.hasCNPS,
        cnpsNumber: data.cnpsNumber,
        hasCMU: data.hasCMU,
        cmuNumber: data.cmuNumber,
      });

      toast.success('Enrôlement réussi !', {
        description: `Code marchand: ${result.merchantCode}`,
        duration: 5000,
      });
      
      // Rediriger vers la liste des marchands ou page de confirmation
      setTimeout(() => {
        setLocation('/agent/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'enrôlement:', error);
      toast.error('Erreur lors de l\'enrôlement', {
        description: 'Veuillez réessayer ou contacter le support',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIcon = stepIcons[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/agent/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enrôlement d'un Nouveau Marchand
          </h1>
          <p className="text-gray-600">
            Étape {currentStep} sur 5 : {stepTitles[currentStep]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            {Object.entries(stepTitles).map(([step, title]) => (
              <span
                key={step}
                className={`${
                  parseInt(step) === currentStep
                    ? 'font-bold text-blue-600'
                    : parseInt(step) < currentStep
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                {parseInt(step)}. {title.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        {/* Card with Current Step */}
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <StepIcon className="h-8 w-8 text-blue-600" />
              {stepTitles[currentStep]}
            </CardTitle>
            <CardDescription className="text-base">
              {currentStep === 1 && 'Renseignez les informations de base du marchand'}
              {currentStep === 2 && 'Capturez les photos des documents officiels'}
              {currentStep === 3 && 'Confirmez la position GPS et le marché'}
              {currentStep === 4 && 'Informations sur la couverture sociale (optionnel)'}
              {currentStep === 5 && 'Vérifiez les informations avant validation'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Étape 1 : Informations Personnelles */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="fullName" className="text-lg">Nom Complet *</Label>
                  <Input
                    id="fullName"
                    value={data.fullName}
                    onChange={(e) => setData({ ...data, fullName: e.target.value })}
                    placeholder="Ex: Kouassi Yao Jean"
                    className="mt-2 h-12 text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-lg">Numéro de Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    placeholder="Ex: 0123456789"
                    className="mt-2 h-12 text-lg"
                    maxLength={10}
                  />
                  <p className="text-sm text-gray-500 mt-1">Format: 10 chiffres</p>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth" className="text-lg">Date de Naissance *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={data.dateOfBirth}
                    onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
                    className="mt-2 h-12 text-lg"
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                      .toISOString()
                      .split('T')[0]}
                  />
                  <p className="text-sm text-gray-500 mt-1">Le marchand doit avoir au moins 18 ans</p>
                </div>
              </div>
            )}

            {/* Étape 2 : Pièces Justificatives */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {data.idPhoto ? (
                    <div>
                      <img
                        src={data.idPhoto}
                        alt="Pièce d'identité"
                        className="max-w-full max-h-64 mx-auto rounded-lg mb-4"
                      />
                      <p className="text-green-600 font-semibold mb-4">✓ Photo capturée</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setData({ ...data, idPhoto: null });
                          idPhotoCapture.clearPhoto();
                        }}
                      >
                        Reprendre la photo
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Photo de la Pièce d'Identité *</h3>
                      <p className="text-gray-600 mb-4">CNI, Passeport ou Attestation d'identité</p>
                      <input
                        type="file"
                        ref={idPhotoCapture.fileInputRef}
                        onChange={idPhotoCapture.handleFileChange}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={idPhotoCapture.capturePhoto}
                        disabled={idPhotoCapture.isCapturing}
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        {idPhotoCapture.isCapturing ? 'Chargement...' : 'Capturer la Photo'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {data.licensePhoto ? (
                    <div>
                      <img
                        src={data.licensePhoto}
                        alt="Licence commerciale"
                        className="max-w-full max-h-64 mx-auto rounded-lg mb-4"
                      />
                      <p className="text-green-600 font-semibold mb-4">✓ Photo capturée</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setData({ ...data, licensePhoto: null });
                          licensePhotoCapture.clearPhoto();
                        }}
                      >
                        Reprendre la photo
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Photo de la Licence Commerciale *</h3>
                      <p className="text-gray-600 mb-4">Autorisation d'exercer au marché</p>
                      <input
                        type="file"
                        ref={licensePhotoCapture.fileInputRef}
                        onChange={licensePhotoCapture.handleFileChange}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={licensePhotoCapture.capturePhoto}
                        disabled={licensePhotoCapture.isCapturing}
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        {licensePhotoCapture.isCapturing ? 'Chargement...' : 'Capturer la Photo'}
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500 italic">
                  💡 Astuce : Assurez-vous que les photos sont nettes et lisibles
                </p>
              </div>
            )}

            {/* Étape 3 : Localisation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                  <MapPin className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Position GPS Actuelle</h3>
                  {data.latitude && data.longitude ? (
                    <div>
                      <p className="text-gray-700">
                        Latitude: {data.latitude.toFixed(6)}
                      </p>
                      <p className="text-gray-700">
                        Longitude: {data.longitude.toFixed(6)}
                      </p>
                      <p className="text-green-600 font-semibold mt-2">✓ Position confirmée</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-4">Aucune position enregistrée</p>
                      <Button
                        onClick={() => {
                          // Géolocalisation GPS
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setData({
                                  ...data,
                                  latitude: position.coords.latitude,
                                  longitude: position.coords.longitude,
                                });
                                toast.success('Position GPS capturée avec succès');
                              },
                              (error) => {
                                toast.error('Impossible d\'obtenir la position GPS', {
                                  description: 'Vérifiez que la géolocalisation est activée',
                                });
                              }
                            );
                          } else {
                            toast.error('Géolocalisation non supportée par ce navigateur');
                          }
                        }}
                      >
                        <MapPin className="h-5 w-5 mr-2" />
                        Obtenir ma Position GPS
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="marketId" className="text-lg">Marché d'Affectation *</Label>
                  <select
                    id="marketId"
                    value={data.marketId || ''}
                    onChange={(e) => setData({ ...data, marketId: parseInt(e.target.value) })}
                    className="mt-2 w-full h-12 px-4 text-lg border border-gray-300 rounded-md"
                  >
                    <option value="">Sélectionnez un marché</option>
                    {markets?.map((market) => (
                      <option key={market.id} value={market.id}>
                        {market.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Étape 4 : Couverture Sociale */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Checkbox
                      id="hasCNPS"
                      checked={data.hasCNPS}
                      onCheckedChange={(checked) =>
                        setData({ ...data, hasCNPS: checked as boolean })
                      }
                    />
                    <Label htmlFor="hasCNPS" className="text-lg font-semibold cursor-pointer">
                      Le marchand a une carte CNPS
                    </Label>
                  </div>

                  {data.hasCNPS && (
                    <div className="ml-8">
                      <Label htmlFor="cnpsNumber">Numéro de Carte CNPS</Label>
                      <Input
                        id="cnpsNumber"
                        value={data.cnpsNumber}
                        onChange={(e) => setData({ ...data, cnpsNumber: e.target.value })}
                        placeholder="Ex: CNPS123456789"
                        className="mt-2 h-12"
                      />
                    </div>
                  )}
                </div>

                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Checkbox
                      id="hasCMU"
                      checked={data.hasCMU}
                      onCheckedChange={(checked) =>
                        setData({ ...data, hasCMU: checked as boolean })
                      }
                    />
                    <Label htmlFor="hasCMU" className="text-lg font-semibold cursor-pointer">
                      Le marchand a une carte CMU
                    </Label>
                  </div>

                  {data.hasCMU && (
                    <div className="ml-8">
                      <Label htmlFor="cmuNumber">Numéro de Carte CMU</Label>
                      <Input
                        id="cmuNumber"
                        value={data.cmuNumber}
                        onChange={(e) => setData({ ...data, cmuNumber: e.target.value })}
                        placeholder="Ex: CMU987654321"
                        className="mt-2 h-12"
                      />
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500 italic">
                  ℹ️ Cette étape est optionnelle. Vous pouvez continuer sans renseigner ces informations.
                </p>
              </div>
            )}

            {/* Étape 5 : Récapitulatif */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-xl font-bold mb-4">Récapitulatif de l'Enrôlement</h3>
                  
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Nom Complet:</span>
                      <span>{data.fullName}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Téléphone:</span>
                      <span>{data.phone}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Date de Naissance:</span>
                      <span>{new Date(data.dateOfBirth).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Pièces Justificatives:</span>
                      <span className="text-green-600">✓ 2 photos capturées</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Position GPS:</span>
                      <span className="text-green-600">✓ Confirmée</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Marché:</span>
                      <span>{markets?.find(m => m.id === data.marketId)?.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">CNPS:</span>
                      <span>{data.hasCNPS ? `✓ ${data.cnpsNumber}` : 'Non renseigné'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">CMU:</span>
                      <span>{data.hasCMU ? `✓ ${data.cmuNumber}` : 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    ℹ️ En validant, un code marchand unique sera généré automatiquement (format: MRC-XXXXX).
                    Le marchand recevra ses identifiants de connexion par SMS.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Précédent
              </Button>

              {currentStep < 5 ? (
                <Button size="lg" onClick={handleNext}>
                  Suivant
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Enrôlement en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Valider l'Enrôlement
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
