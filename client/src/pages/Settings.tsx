import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Save,
  User,
  Bell,
  Globe,
  Moon,
  PiggyBank,
  Sun,
  Clock,
  Settings as SettingsIcon
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, merchant } = useAuth();

  const [language, setLanguage] = useState('fr');
  const [theme, setTheme] = useState('light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [savingsEnabled, setSavingsEnabled] = useState(true);
  const [savingsThreshold, setSavingsThreshold] = useState('20000');
  const [savingsPercentage, setSavingsPercentage] = useState('2');
  const [briefingEnabled, setBriefingEnabled] = useState(true);
  const [briefingTime, setBriefingTime] = useState('08:00');
  const [reminderOpeningTime, setReminderOpeningTime] = useState('09:00');
  const [reminderClosingTime, setReminderClosingTime] = useState('20:00');

  const merchantId = merchant?.id;

  const { data: merchantSettings, isLoading: loadingMerchantSettings } =
    trpc.merchantSettings.get.useQuery(
      { merchantId: merchantId! },
      { enabled: !!merchantId }
    );

  useEffect(() => {
    if (merchantSettings) {
      setSavingsEnabled(merchantSettings.savingsProposalEnabled);
      setSavingsThreshold(merchantSettings.savingsProposalThreshold);
      setSavingsPercentage(merchantSettings.savingsProposalPercentage);
      setNotificationsEnabled(merchantSettings.groupedOrderNotificationsEnabled);
      setBriefingEnabled(merchantSettings.morningBriefingEnabled);
      setBriefingTime(merchantSettings.morningBriefingTime || '08:00');
      setReminderOpeningTime(merchantSettings.reminderOpeningTime || '09:00');
      setReminderClosingTime(merchantSettings.reminderClosingTime || '20:00');
    }
  }, [merchantSettings]);

  const updateMerchantSettings = trpc.merchantSettings.update.useMutation({
    onSuccess: () => {
      toast.success('Paramètres sauvegardés !');
    },
    onError: (error) => {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    },
  });

  const handleSaveMerchantSettings = () => {
    if (!merchantId) return;

    updateMerchantSettings.mutate({
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

  const handleSaveGeneralSettings = () => {
    toast.success('Paramètres généraux sauvegardés !');
  };

  const getBackUrl = () => {
    if (merchantId) return '/merchant/dashboard';
    return '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(getBackUrl())}
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

      <div className="container max-w-4xl mx-auto p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="general">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            {merchantId && (
              <TabsTrigger value="merchant">
                <PiggyBank className="h-4 w-4 mr-2" />
                Marchand
              </TabsTrigger>
            )}
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Langue</h2>
                  <p className="text-sm text-gray-600">Choisis ta langue préférée</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="language" className="text-base font-semibold">
                  Langue de l'interface
                </Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-12 px-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="fr">Français</option>
                  <option value="nouchi">Nouchi</option>
                  <option value="en">English</option>
                </select>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Moon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Apparence</h2>
                  <p className="text-sm text-gray-600">Mode clair ou sombre</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="theme" className="text-base font-semibold">
                  Thème
                </Label>
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full h-12 px-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                  <option value="auto">Automatique</option>
                </select>
              </div>
            </Card>

            <Button
              onClick={handleSaveGeneralSettings}
              className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Save className="w-5 h-5 mr-2" />
              Sauvegarder
            </Button>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Préférences de notifications</h2>
                  <p className="text-sm text-gray-600">Gère tes alertes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notif-general" className="text-base font-semibold">
                      Notifications générales
                    </Label>
                    <p className="text-sm text-gray-600">Alertes système importantes</p>
                  </div>
                  <Switch
                    id="notif-general"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
              </div>
            </Card>

            <Button
              onClick={handleSaveGeneralSettings}
              className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Save className="w-5 h-5 mr-2" />
              Sauvegarder
            </Button>
          </TabsContent>

          {merchantId && (
            <TabsContent value="merchant" className="space-y-6">
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
                        <Input
                          id="threshold"
                          type="number"
                          value={savingsThreshold}
                          onChange={(e) => setSavingsThreshold(e.target.value)}
                          className="text-lg h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="percentage" className="text-base font-semibold">
                          Pourcentage suggéré (%)
                        </Label>
                        <Input
                          id="percentage"
                          type="number"
                          step="0.1"
                          value={savingsPercentage}
                          onChange={(e) => setSavingsPercentage(e.target.value)}
                          className="text-lg h-12"
                        />
                      </div>
                    </>
                  )}
                </div>
              </Card>

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
                      <Input
                        id="briefing-time"
                        type="time"
                        value={briefingTime}
                        onChange={(e) => setBriefingTime(e.target.value)}
                        className="text-lg h-12"
                      />
                    </div>
                  )}
                </div>
              </Card>

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
                    <Input
                      id="reminder-opening"
                      type="time"
                      value={reminderOpeningTime}
                      onChange={(e) => setReminderOpeningTime(e.target.value)}
                      className="text-lg h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder-closing" className="text-base font-semibold">
                      Rappel de fermeture
                    </Label>
                    <Input
                      id="reminder-closing"
                      type="time"
                      value={reminderClosingTime}
                      onChange={(e) => setReminderClosingTime(e.target.value)}
                      className="text-lg h-12"
                    />
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleSaveMerchantSettings}
                disabled={updateMerchantSettings.isPending}
                className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Save className="w-5 h-5 mr-2" />
                {updateMerchantSettings.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </TabsContent>
          )}

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Informations du profil</h2>
                  <p className="text-sm text-gray-600">Tes informations personnelles</p>
                </div>
              </div>

              <div className="flex justify-center py-4">
                <ProfilePhotoUpload
                  currentPhotoUrl={user?.profilePhotoUrl}
                  onPhotoUploaded={(url) => {
                    console.log('Photo uploaded:', url);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-semibold">
                    Nom complet
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={user?.name || merchant?.name || ''}
                    disabled
                    className="text-lg h-12 bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="text-lg h-12 bg-gray-100"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Info :</strong> Pour modifier ces informations, contacte le support SUTA.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
