import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, Calendar, AlertTriangle, CheckCircle2, Clock, FileText, Upload, X } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Page de gestion de la couverture sociale (CNPS/CMU/RSTI)
 * Permet aux marchands de :
 * - Voir l'état de leur couverture sociale
 * - Soumettre des demandes de renouvellement
 * - Suivre l'état de leurs demandes
 */

export default function SocialProtection() {
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'cnps' | 'cmu' | 'rsti' | null>(null);
  const [requestedExpiryDate, setRequestedExpiryDate] = useState('');
  const [merchantNotes, setMerchantNotes] = useState('');
  const [proofDocument, setProofDocument] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);

  // Récupérer les informations du marchand
  const { data: merchant, isLoading: merchantLoading } = trpc.auth.myMerchant.useQuery();

  // Récupérer l'historique des demandes
  const { data: renewals, isLoading: renewalsLoading, refetch: refetchRenewals } = trpc.socialProtection.listByMerchant.useQuery({
    limit: 20,
    offset: 0,
  });

  // Mutation pour créer une demande
  const createRenewal = trpc.socialProtection.createRenewal.useMutation({
    onSuccess: () => {
      toast.success('Demande de renouvellement envoyée avec succès');
      setRenewalDialogOpen(false);
      resetForm();
      refetchRenewals();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const resetForm = () => {
    setSelectedType(null);
    setRequestedExpiryDate('');
    setMerchantNotes('');
    setProofDocument(null);
    setProofFileName(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5MB');
      return;
    }

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }

    // Convertir en base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofDocument(reader.result as string);
      setProofFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selectedType) {
      toast.error('Veuillez sélectionner le type de couverture');
      return;
    }

    if (!requestedExpiryDate) {
      toast.error('Veuillez indiquer la date d\'expiration souhaitée');
      return;
    }

    if (!proofDocument) {
      toast.error('Veuillez joindre un justificatif');
      return;
    }

    createRenewal.mutate({
      type: selectedType,
      requestedExpiryDate,
      proofDocument,
      merchantNotes: merchantNotes || undefined,
    });
  };

  const openRenewalDialog = (type: 'cnps' | 'cmu' | 'rsti') => {
    setSelectedType(type);
    setRenewalDialogOpen(true);
  };

  const getDaysUntilExpiry = (expiryDate: Date | null) => {
    if (!expiryDate) return null;
    return differenceInDays(new Date(expiryDate), new Date());
  };

  const getExpiryBadge = (expiryDate: Date | null) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return <Badge variant="secondary">Non défini</Badge>;
    if (days < 0) return <Badge variant="destructive">Expiré</Badge>;
    if (days <= 7) return <Badge variant="destructive">Expire dans {days} jours</Badge>;
    if (days <= 30) return <Badge className="bg-orange-500 hover:bg-orange-600">Expire dans {days} jours</Badge>;
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Valide ({days} jours)</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejeté</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (merchantLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Marchand non trouvé</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cnpsExpiry = merchant.cnpsExpiryDate;
  const cmuExpiry = merchant.cmuExpiryDate;
  const rstiExpiry = merchant.socialProtection?.rstiExpiryDate;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-orange-600" />
          Ma Couverture Sociale
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos couvertures CNPS, CMU et RSTI
        </p>
      </div>

      {/* Cartes de statut des couvertures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CNPS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>CNPS</span>
              {getExpiryBadge(cnpsExpiry)}
            </CardTitle>
            <CardDescription>Caisse Nationale de Prévoyance Sociale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cnpsExpiry ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Expire le {format(new Date(cnpsExpiry), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                {getDaysUntilExpiry(cnpsExpiry)! <= 30 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <p className="text-sm text-orange-800">
                      Votre CNPS expire bientôt. Pensez à la renouveler.
                    </p>
                  </div>
                )}
                <Button 
                  onClick={() => openRenewalDialog('cnps')} 
                  className="w-full"
                  variant="outline"
                >
                  Renouveler
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">Aucune couverture CNPS enregistrée</p>
                <Button 
                  onClick={() => openRenewalDialog('cnps')} 
                  className="w-full"
                >
                  Demander une couverture
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CMU */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>CMU</span>
              {getExpiryBadge(cmuExpiry)}
            </CardTitle>
            <CardDescription>Couverture Maladie Universelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cmuExpiry ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Expire le {format(new Date(cmuExpiry), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                {getDaysUntilExpiry(cmuExpiry)! <= 30 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <p className="text-sm text-orange-800">
                      Votre CMU expire bientôt. Pensez à la renouveler.
                    </p>
                  </div>
                )}
                <Button 
                  onClick={() => openRenewalDialog('cmu')} 
                  className="w-full"
                  variant="outline"
                >
                  Renouveler
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">Aucune couverture CMU enregistrée</p>
                <Button 
                  onClick={() => openRenewalDialog('cmu')} 
                  className="w-full"
                >
                  Demander une couverture
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSTI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>RSTI</span>
              {rstiExpiry ? getExpiryBadge(rstiExpiry) : null}
            </CardTitle>
            <CardDescription>Régime Social des Travailleurs Indépendants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rstiExpiry ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Expire le {format(new Date(rstiExpiry), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                {getDaysUntilExpiry(rstiExpiry)! <= 30 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <p className="text-sm text-orange-800">
                      Votre RSTI expire bientôt. Pensez à la renouveler.
                    </p>
                  </div>
                )}
                <Button 
                  onClick={() => openRenewalDialog('rsti')} 
                  className="w-full"
                  variant="outline"
                >
                  Renouveler
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">Aucune couverture RSTI enregistrée</p>
                <Button 
                  onClick={() => openRenewalDialog('rsti')} 
                  className="w-full"
                >
                  Demander une couverture
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique des demandes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historique des demandes
          </CardTitle>
          <CardDescription>Suivez l'état de vos demandes de renouvellement</CardDescription>
        </CardHeader>
        <CardContent>
          {renewalsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : renewals && renewals.length > 0 ? (
            <div className="space-y-4">
              {renewals.map((renewal) => (
                <div
                  key={renewal.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{renewal.type.toUpperCase()}</span>
                      {getStatusBadge(renewal.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Demandé le {format(new Date(renewal.requestedAt), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                      {renewal.requestedExpiryDate && (
                        <p>
                          Nouvelle expiration : {format(new Date(renewal.requestedExpiryDate), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      )}
                      {renewal.reviewedAt && (
                        <p>
                          Traité le {format(new Date(renewal.reviewedAt), 'dd MMMM yyyy', { locale: fr })}
                          {renewal.reviewedByName && ` par ${renewal.reviewedByName}`}
                        </p>
                      )}
                      {renewal.adminNotes && (
                        <p className="italic">Note admin : {renewal.adminNotes}</p>
                      )}
                    </div>
                  </div>
                  {renewal.proofDocumentUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(renewal.proofDocumentUrl!, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Voir le justificatif
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune demande de renouvellement
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de demande de renouvellement */}
      <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Demande de renouvellement {selectedType?.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Remplissez ce formulaire pour soumettre votre demande de renouvellement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type (lecture seule) */}
            <div className="space-y-2">
              <Label>Type de couverture</Label>
              <Input value={selectedType?.toUpperCase() || ''} disabled />
            </div>

            {/* Date d'expiration souhaitée */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Nouvelle date d'expiration *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={requestedExpiryDate}
                onChange={(e) => setRequestedExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Upload du justificatif */}
            <div className="space-y-2">
              <Label htmlFor="proofDocument">Justificatif (carte, attestation) *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="proofDocument"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('proofDocument')?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {proofFileName || 'Choisir un fichier'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Format : JPG, PNG. Taille max : 5MB
              </p>
            </div>

            {/* Notes optionnelles */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Informations complémentaires..."
                value={merchantNotes}
                onChange={(e) => setMerchantNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenewalDialogOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createRenewal.isPending}
            >
              {createRenewal.isPending ? 'Envoi en cours...' : 'Soumettre la demande'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
