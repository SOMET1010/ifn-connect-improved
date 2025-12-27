import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, PiggyBank, Bell, Sun, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import MobileNavigation from '@/components/accessibility/MobileNavigation';

/**
 * Page de paramètres pour le marchand
 */
export default function MerchantSettings() {
  const [, setLocation] = useLocation();
  const merchantId = 1; // Mock - à remplacer

  // Charger les paramètres actuels
  const { data: settings, isLoading } = trpc.merchantSettings.get.useQuery({ merchantId });
  
  // États locaux pour le formulaire
  const [savingsEnabled, setSavingsEnabled] = useState(settings?.savingsProposalEnabled ?? true);
  const [savingsThreshold, setSavingsThreshold] = useState(settings?.savingsProposalThreshold ?? '20000');
  const [savingsPercentage, setSavingsPercentage] = useState(settings?.savingsProposalPercentage ?? '2');
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings?.groupedOrderNotificationsEnabled ?? true);
  const [briefingEnabled, setBriefingEnabled] = useState(settings?.morningBriefingEnabled ?? true);
  const [briefingTime, setBriefingTime] = useState(settings?.morningBriefingTime ?? '08:00');
  const [reminderOpeningTime, setReminderOpeningTime] = useState(settings?.reminderOpeningTime ?? '09:00');
  const [reminderClosingTime, setReminderClosingTime] = useState(settings?.reminderClosingTime ?? '20:00');

  // Mettre à jour les états quand les settings sont chargés
  useState(() => {
    if (settings) {
      setSavingsEnabled(settings.savingsProposalEnabled);
      setSavingsThreshold(settings.savingsProposalThreshold);
      setSavingsPercentage(settings.savingsProposalPercentage);
      setNotificationsEnabled(settings.groupedOrderNotificationsEnabled);
      setBriefingEnabled(settings.morningBriefingEnabled);
      setBriefingTime(settings.morningBriefingTime || '08:00');
      setReminderOpeningTime(settings.reminderOpeningTime || '09:00');
      setReminderClosingTime(settings.reminderClosingTime || '20:00');
    }
  });

  // Mutation pour sauvegarder
  const updateSettings = trpc.merchantSettings.update.useMutation({
    onSuccess: () => {
      toast.success('Paramètres sauvegardés !');
    },
    onError: (error) => {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    },
  });

  const handleSave = () => {
    updateSettings.mutate({
      merchantId,
      savingsProposalEnabled: savingsEnabled,
      savingsProposalThreshold: savingsThreshold,
      savingsProposalPercentage: savingsPercentage,
      groupedOrderNotificationsEnabled: notificationsEnabled,
      morningBriefingEnabled: briefingEnabled,
      morningBriefingTime: briefingTime,
      reminderOpeningTime,
      reminderClosingTime,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/merchant/dashboard')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <p className="text-orange-100 text-sm">Personnalise ton expérience SUTA</p>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        {/* Paramètres d'épargne automatique */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Épargne Automatique</h2>
              <p className="text-sm text-gray-600">Proposition après grosse vente</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="savings-enabled" className="text-base font-semibold">
                  Activer les propositions
                </Label>
                <p className="text-sm text-gray-600">SUTA te proposera d'épargner automatiquement</p>
              </div>
              <Switch
                id="savings-enabled"
                checked={savingsEnabled}
                onCheckedChange={setSavingsEnabled}
              />
            </div>

            {savingsEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="threshold" className="text-base font-semibold">
                    Montant minimum de vente (FCFA)
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    SUTA proposera l'épargne seulement si la vente dépasse ce montant
                  </p>
                  <Input
                    id="threshold"
                    type="number"
                    value={savingsThreshold}
                    onChange={(e) => setSavingsThreshold(e.target.value)}
                    className="text-lg h-14"
                    placeholder="20000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentage" className="text-base font-semibold">
                    Pourcentage suggéré (%)
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    SUTA proposera ce pourcentage de la vente
                  </p>
                  <Input
                    id="percentage"
                    type="number"
                    step="0.1"
                    value={savingsPercentage}
                    onChange={(e) => setSavingsPercentage(e.target.value)}
                    className="text-lg h-14"
                    placeholder="2"
                  />
                  <p className="text-xs text-gray-500">
                    Exemple : Pour une vente de 50.000 FCFA à {savingsPercentage}%, 
                    SUTA proposera {Math.floor(50000 * parseFloat(savingsPercentage) / 100).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Paramètres de notifications */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
              <p className="text-sm text-gray-600">Alertes et opportunités</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications-enabled" className="text-base font-semibold">
                Commandes groupées
              </Label>
              <p className="text-sm text-gray-600">Recevoir les opportunités d'économies</p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </Card>

        {/* Paramètres de briefing matinal */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Sun className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Briefing Matinal</h2>
              <p className="text-sm text-gray-600">Ton résumé quotidien</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="briefing-enabled" className="text-base font-semibold">
                  Activer le briefing
                </Label>
                <p className="text-sm text-gray-600">SUTA te fera un résumé au premier login</p>
              </div>
              <Switch
                id="briefing-enabled"
                checked={briefingEnabled}
                onCheckedChange={setBriefingEnabled}
              />
            </div>

            {briefingEnabled && (
              <div className="space-y-2">
                <Label htmlFor="briefing-time" className="text-base font-semibold">
                  Heure préférée
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  SUTA te briefera à partir de cette heure
                </p>
                <Input
                  id="briefing-time"
                  type="time"
                  value={briefingTime}
                  onChange={(e) => setBriefingTime(e.target.value)}
                  className="text-lg h-14"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Paramètres de rappels d'ouverture/fermeture */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Rappels de Journée</h2>
              <p className="text-sm text-gray-600">Ouverture et fermeture</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-opening" className="text-base font-semibold">
                Rappel d'ouverture
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                SUTA te rappellera d'ouvrir ta journée à cette heure
              </p>
              <Input
                id="reminder-opening"
                type="time"
                value={reminderOpeningTime}
                onChange={(e) => setReminderOpeningTime(e.target.value)}
                className="text-lg h-14"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-closing" className="text-base font-semibold">
                Rappel de fermeture
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                SUTA te rappellera de fermer ta journée à cette heure
              </p>
              <Input
                id="reminder-closing"
                type="time"
                value={reminderClosingTime}
                onChange={(e) => setReminderClosingTime(e.target.value)}
                className="text-lg h-14"
              />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>🔔 Astuce :</strong> Les rappels sont envoyés uniquement si tu n'as pas encore ouvert/fermé ta journée. Choisis des heures adaptées à ton rythme de travail !
              </p>
            </div>
          </div>
        </Card>

        {/* Bouton de sauvegarde */}
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="w-full h-16 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          <Save className="w-6 h-6 mr-2" />
          {updateSettings.isPending ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>

      {/* Navigation mobile */}
      <MobileNavigation 
        activeItem="help"
        onItemClick={(itemId) => {
          if (itemId === 'sell') setLocation('/merchant/cash-register');
          if (itemId === 'stock') setLocation('/merchant/stock');
          if (itemId === 'money') setLocation('/merchant/money');
          if (itemId === 'help') setLocation('/merchant/help');
        }}
      />
    </div>
  );
}
