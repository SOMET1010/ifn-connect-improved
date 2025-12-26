import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';

interface MerchantEditModalProps {
  merchantId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MerchantEditModal({
  merchantId,
  open,
  onClose,
  onSuccess,
}: MerchantEditModalProps) {
  const utils = trpc.useUtils();

  // États du formulaire - Informations générales
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // États du formulaire - Activité commerciale
  const [actorType, setActorType] = useState<'grossiste' | 'semi-grossiste' | 'detaillant' | ''>('');
  const [products, setProducts] = useState('');
  const [numberOfStores, setNumberOfStores] = useState('0');
  const [tableNumber, setTableNumber] = useState('');
  const [boxNumber, setBoxNumber] = useState('');
  const [sector, setSector] = useState('');

  // États du formulaire - Protection sociale
  const [hasCMU, setHasCMU] = useState(false);
  const [cmuNumber, setCmuNumber] = useState('');
  const [cmuStatus, setCmuStatus] = useState<'active' | 'inactive' | 'pending' | 'expired'>('pending');
  const [cmuExpiryDate, setCmuExpiryDate] = useState('');

  const [hasCNPS, setHasCNPS] = useState(false);
  const [cnpsNumber, setCnpsNumber] = useState('');
  const [cnpsStatus, setCnpsStatus] = useState<'active' | 'inactive' | 'pending' | 'expired'>('pending');
  const [cnpsExpiryDate, setCnpsExpiryDate] = useState('');

  const [hasRSTI, setHasRSTI] = useState(false);
  const [rstiNumber, setRstiNumber] = useState('');
  const [rstiStatus, setRstiStatus] = useState<'active' | 'inactive' | 'pending' | 'expired'>('pending');
  const [rstiExpiryDate, setRstiExpiryDate] = useState('');

  // Récupérer les données du marchand
  const { data: merchant, isLoading } = trpc.admin.getMerchantDetails.useQuery(
    { merchantId },
    { enabled: open && merchantId > 0 }
  );

  // Mutation pour mettre à jour le marchand
  const updateMerchant = trpc.admin.updateMerchant.useMutation({
    onSuccess: () => {
      toast.success('Marchand mis à jour avec succès');
      utils.admin.listMerchants.invalidate();
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Charger les données du marchand dans le formulaire
  useEffect(() => {
    if (merchant) {
      // Informations générales
      setBusinessName(merchant.businessName || '');
      setBusinessType(merchant.businessType || '');
      setLocation(merchant.location || '');
      setPhone(merchant.userPhone || '');
      setIsVerified(merchant.isVerified || false);

      // Activité commerciale
      if (merchant.activity) {
        setActorType(merchant.activity.actorType || '');
        setProducts(merchant.activity.products || '');
        setNumberOfStores(merchant.activity.numberOfStores?.toString() || '0');
        setTableNumber(merchant.activity.tableNumber || '');
        setBoxNumber(merchant.activity.boxNumber || '');
        setSector(merchant.activity.sector || '');
      }

      // Protection sociale
      if (merchant.socialProtection) {
        setHasCMU(merchant.socialProtection.hasCMU || false);
        setCmuNumber(merchant.socialProtection.cmuNumber || '');
        setCmuStatus(merchant.socialProtection.cmuStatus || 'pending');
        setCmuExpiryDate(merchant.socialProtection.cmuExpiryDate ? new Date(merchant.socialProtection.cmuExpiryDate).toISOString().split('T')[0] : '');

        setHasCNPS(merchant.socialProtection.hasCNPS || false);
        setCnpsNumber(merchant.socialProtection.cnpsNumber || '');
        setCnpsStatus(merchant.socialProtection.cnpsStatus || 'pending');
        setCnpsExpiryDate(merchant.socialProtection.cnpsExpiryDate ? new Date(merchant.socialProtection.cnpsExpiryDate).toISOString().split('T')[0] : '');

        setHasRSTI(merchant.socialProtection.hasRSTI || false);
        setRstiNumber(merchant.socialProtection.rstiNumber || '');
        setRstiStatus(merchant.socialProtection.rstiStatus || 'pending');
        setRstiExpiryDate(merchant.socialProtection.rstiExpiryDate ? new Date(merchant.socialProtection.rstiExpiryDate).toISOString().split('T')[0] : '');
      }
    }
  }, [merchant]);

  const handleSubmit = () => {
    // Validation basique
    if (!businessName.trim()) {
      toast.error('Le nom du marchand est requis');
      return;
    }

    if (phone && !/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
      toast.error('Le numéro de téléphone doit contenir 10 chiffres');
      return;
    }

    updateMerchant.mutate({
      merchantId,
      general: {
        businessName: businessName.trim(),
        businessType: businessType.trim() || null,
        location: location.trim() || null,
        phone: phone.trim() || null,
        isVerified,
      },
      activity: {
        actorType: actorType || null,
        products: products.trim() || null,
        numberOfStores: parseInt(numberOfStores) || 0,
        tableNumber: tableNumber.trim() || null,
        boxNumber: boxNumber.trim() || null,
        sector: sector.trim() || null,
      },
      socialProtection: {
        hasCMU,
        cmuNumber: cmuNumber.trim() || null,
        cmuStatus,
        cmuExpiryDate: cmuExpiryDate ? new Date(cmuExpiryDate).toISOString() : null,
        hasCNPS,
        cnpsNumber: cnpsNumber.trim() || null,
        cnpsStatus,
        cnpsExpiryDate: cnpsExpiryDate ? new Date(cnpsExpiryDate).toISOString() : null,
        hasRSTI,
        rstiNumber: rstiNumber.trim() || null,
        rstiStatus,
        rstiExpiryDate: rstiExpiryDate ? new Date(rstiExpiryDate).toISOString() : null,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le marchand</DialogTitle>
          <DialogDescription>
            {merchant?.merchantNumber} - {merchant?.businessName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Informations générales</TabsTrigger>
              <TabsTrigger value="activity">Activité commerciale</TabsTrigger>
              <TabsTrigger value="social">Protection sociale</TabsTrigger>
            </TabsList>

            {/* Onglet 1 : Informations générales */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Nom du marchand *</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: FOFANA MAWA"
                  />
                </div>

                <div>
                  <Label htmlFor="businessType">Type d'activité</Label>
                  <Input
                    id="businessType"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="Ex: Vivrier, Épicerie"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Coopérative / Marché</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: PACA, COCOVICO"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0504410019"
                    maxLength={10}
                  />
                </div>

                <div className="flex items-center space-x-2 col-span-2">
                  <Switch
                    id="isVerified"
                    checked={isVerified}
                    onCheckedChange={setIsVerified}
                  />
                  <Label htmlFor="isVerified">Marchand vérifié</Label>
                </div>
              </div>
            </TabsContent>

            {/* Onglet 2 : Activité commerciale */}
            <TabsContent value="activity" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="actorType">Type d'acteur</Label>
                  <Select value={actorType} onValueChange={(value: any) => setActorType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Non spécifié</SelectItem>
                      <SelectItem value="grossiste">Grossiste</SelectItem>
                      <SelectItem value="semi-grossiste">Semi-grossiste</SelectItem>
                      <SelectItem value="detaillant">Détaillant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="numberOfStores">Nombre de magasins</Label>
                  <Input
                    id="numberOfStores"
                    type="number"
                    min="0"
                    value={numberOfStores}
                    onChange={(e) => setNumberOfStores(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="tableNumber">Numéro de table</Label>
                  <Input
                    id="tableNumber"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: T12"
                  />
                </div>

                <div>
                  <Label htmlFor="boxNumber">Numéro de box</Label>
                  <Input
                    id="boxNumber"
                    value={boxNumber}
                    onChange={(e) => setBoxNumber(e.target.value)}
                    placeholder="Ex: B04"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="sector">Secteur commercial</Label>
                  <Input
                    id="sector"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Ex: Vivrier, Légumes"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="products">Produits commercialisés</Label>
                  <Textarea
                    id="products"
                    value={products}
                    onChange={(e) => setProducts(e.target.value)}
                    placeholder="Ex: riz, igname, maïs (séparés par des virgules)"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Séparez les produits par des virgules
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Onglet 3 : Protection sociale */}
            <TabsContent value="social" className="space-y-6 mt-4">
              {/* CMU */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">CMU (Couverture Maladie Universelle)</h3>
                  <Switch checked={hasCMU} onCheckedChange={setHasCMU} />
                </div>
                {hasCMU && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cmuNumber">Numéro CMU</Label>
                      <Input
                        id="cmuNumber"
                        value={cmuNumber}
                        onChange={(e) => setCmuNumber(e.target.value)}
                        placeholder="Ex: CMU123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cmuStatus">Statut</Label>
                      <Select value={cmuStatus} onValueChange={(value: any) => setCmuStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="expired">Expiré</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="cmuExpiryDate">Date d'expiration</Label>
                      <Input
                        id="cmuExpiryDate"
                        type="date"
                        value={cmuExpiryDate}
                        onChange={(e) => setCmuExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CNPS */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">CNPS (Caisse Nationale de Prévoyance Sociale)</h3>
                  <Switch checked={hasCNPS} onCheckedChange={setHasCNPS} />
                </div>
                {hasCNPS && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cnpsNumber">Numéro CNPS</Label>
                      <Input
                        id="cnpsNumber"
                        value={cnpsNumber}
                        onChange={(e) => setCnpsNumber(e.target.value)}
                        placeholder="Ex: CNPS789012"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnpsStatus">Statut</Label>
                      <Select value={cnpsStatus} onValueChange={(value: any) => setCnpsStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="expired">Expiré</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="cnpsExpiryDate">Date d'expiration</Label>
                      <Input
                        id="cnpsExpiryDate"
                        type="date"
                        value={cnpsExpiryDate}
                        onChange={(e) => setCnpsExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* RSTI */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">RSTI (Régime Social des Travailleurs Indépendants)</h3>
                  <Switch checked={hasRSTI} onCheckedChange={setHasRSTI} />
                </div>
                {hasRSTI && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rstiNumber">Numéro RSTI</Label>
                      <Input
                        id="rstiNumber"
                        value={rstiNumber}
                        onChange={(e) => setRstiNumber(e.target.value)}
                        placeholder="Ex: RSTI345678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rstiStatus">Statut</Label>
                      <Select value={rstiStatus} onValueChange={(value: any) => setRstiStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="expired">Expiré</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="rstiExpiryDate">Date d'expiration</Label>
                      <Input
                        id="rstiExpiryDate"
                        type="date"
                        value={rstiExpiryDate}
                        onChange={(e) => setRstiExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateMerchant.isPending}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={updateMerchant.isPending}>
            {updateMerchant.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
