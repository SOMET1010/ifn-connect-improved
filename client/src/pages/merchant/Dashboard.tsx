import { useState } from 'react';
import { ArrowLeft, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import MobileNavigation from '@/components/accessibility/MobileNavigation';
import AudioButton from '@/components/accessibility/AudioButton';
import LanguageSelector from '@/components/accessibility/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpirationAlert } from '@/components/ExpirationAlert';
import { trpc } from '@/lib/trpc';

/**
 * Dashboard Marchand - Mode Simplifié
 * 4 actions principales : Vendre, Stock, Argent, Aide
 */
export default function MerchantDashboard() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleBack = () => {
    setLocation('/');
  };

  const handleNavigation = (section: string) => {
    setActiveSection(section);
    // TODO: Implémenter la navigation entre sections
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            {/* Retour */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Titre */}
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Espace Marchand</h1>
              <AudioButton instructionKey="welcome" size="sm" />
            </div>

            {/* Langue */}
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="content-with-mobile-nav">
        <div className="container py-6 space-y-6">
          {/* Message de bienvenue */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="pictogram pictogram-primary">
                  <img 
                    src="/pictograms/merchant.png" 
                    alt="Marchand" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    I ni ce ! 👋
                  </h2>
                  <p className="text-primary-foreground/90">
                    Bienvenue sur votre espace marchand IFN Connect
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertes d'expiration de couverture sociale */}
          <ExpirationAlertWrapper />

          {/* Statistiques du jour */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ventes du jour */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ventes du jour
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">
                  0 FCFA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  0 transactions
                </p>
              </CardContent>
            </Card>

            {/* Stock */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produits en stock
                </CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  0
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aucun produit ajouté
                </p>
              </CardContent>
            </Card>

            {/* Alertes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alertes
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">
                  0
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aucune alerte
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  size="lg" 
                  className="h-24 flex-col gap-2"
                  onClick={() => handleNavigation('sell')}
                >
                  <Package className="h-8 w-8" />
                  <span>Nouvelle vente</span>
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleNavigation('stock')}
                >
                  <TrendingUp className="h-8 w-8" />
                  <span>Ajouter au stock</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Protection sociale */}
          <Card>
            <CardHeader>
              <CardTitle>Protection sociale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="status-indicator inactive" />
                    <div>
                      <p className="font-medium">CNPS (Retraite)</p>
                      <p className="text-sm text-muted-foreground">Non activé</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Activer
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="status-indicator inactive" />
                    <div>
                      <p className="font-medium">CMU (Santé)</p>
                      <p className="text-sm text-muted-foreground">Non activé</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Activer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message d'aide */}
          <Card className="bg-accent/10 border-accent">
            <CardContent className="pt-6">
              <p className="text-center text-sm">
                💡 <strong>Astuce :</strong> Utilisez la navigation en bas pour accéder rapidement à vos actions principales
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Navigation mobile fixe */}
      <MobileNavigation
        activeItem={activeSection}
        onItemClick={handleNavigation}
      />
    </div>
  );
}

/**
 * Wrapper pour ExpirationAlert qui récupère les données du marchand
 */
function ExpirationAlertWrapper() {
  const { data: merchant } = trpc.auth.myMerchant.useQuery();

  if (!merchant || !merchant.socialProtection) return null;

  return (
    <ExpirationAlert
      cnpsExpiryDate={merchant.socialProtection.cnpsExpiryDate}
      cmuExpiryDate={merchant.socialProtection.cmuExpiryDate}
      rstiExpiryDate={merchant.socialProtection.rstiExpiryDate}
    />
  );
}
