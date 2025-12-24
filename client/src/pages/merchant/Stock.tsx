import { useState } from 'react';
import { useLocation } from 'wouter';
import { Package, AlertTriangle, Plus, Minus, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { audioManager } from '@/lib/audioManager';
import { toast } from 'sonner';
import MobileNavigation from '@/components/accessibility/MobileNavigation';

/**
 * Interface de gestion de stock pour les marchands
 * Avec alertes visuelles et vocales
 */
export default function Stock() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock merchantId - À remplacer par l'ID réel de l'utilisateur connecté
  const merchantId = 1;

  // Charger le stock du marchand
  const { data: stock = [], isLoading, refetch } = trpc.stock.listByMerchant.useQuery({
    merchantId,
  });

  // Charger les produits en stock bas
  const { data: lowStock = [] } = trpc.stock.lowStock.useQuery({
    merchantId,
  });

  // Mutation pour mettre à jour le stock
  const updateStock = trpc.stock.update.useMutation({
    onSuccess: () => {
      toast.success('Stock mis à jour !');
      audioManager.speak('Stock mis à jour');
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });

  // Filtrer les produits par recherche
  const filteredStock = stock.filter(item =>
    item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.productNameDioula?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ajouter des unités au stock
  const handleAdd = (productId: number, currentQuantity: string, amount: number) => {
    const newQuantity = parseFloat(currentQuantity || '0') + amount;
    updateStock.mutate({
      merchantId,
      productId,
      quantity: newQuantity,
    });
  };

  // Retirer des unités du stock
  const handleRemove = (productId: number, currentQuantity: string, amount: number) => {
    const current = parseFloat(currentQuantity || '0');
    const newQuantity = Math.max(0, current - amount);
    updateStock.mutate({
      merchantId,
      productId,
      quantity: newQuantity,
    });
  };

  // Annoncer les alertes de stock bas
  const announceAlerts = () => {
    if (lowStock.length === 0) {
      audioManager.speak('Aucune alerte de stock');
      toast.info('Aucune alerte de stock');
      return;
    }

    const message = `Attention ! ${lowStock.length} produit${lowStock.length > 1 ? 's' : ''} en stock bas`;
    audioManager.speak(message);
    toast.warning(message);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="container flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/merchant/dashboard')}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={24} />
          </Button>
          
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold">📦 Stock</h1>
            <p className="text-sm opacity-90">Gérer mon inventaire</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={announceAlerts}
            className="text-primary-foreground hover:bg-primary-foreground/20 relative"
          >
            <AlertTriangle size={24} />
            {lowStock.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {lowStock.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Alertes de stock bas */}
      {lowStock.length > 0 && (
        <div className="container mt-4">
          <Card className="p-4 bg-destructive/10 border-destructive">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-destructive" size={32} />
              <div>
                <p className="font-bold text-destructive">⚠️ Alerte Stock Bas</p>
                <p className="text-sm text-muted-foreground">
                  {lowStock.length} produit{lowStock.length > 1 ? 's' : ''} nécessite{lowStock.length > 1 ? 'nt' : ''} un réapprovisionnement
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="container mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      {/* Liste des produits */}
      <div className="container mt-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Chargement...</p>
        ) : filteredStock.length === 0 ? (
          <Card className="p-8 text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-bold">Aucun produit trouvé</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez des produits pour commencer'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredStock.map((item) => {
              const quantity = parseFloat(item.quantity || '0');
              const threshold = parseFloat(item.minThreshold || '5');
              const isLow = quantity < threshold;
              const isCritical = quantity < threshold / 2;

              return (
                <Card 
                  key={item.id} 
                  className={`p-4 ${isCritical ? 'border-destructive bg-destructive/5' : isLow ? 'border-warning bg-warning/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package size={24} className={isCritical ? 'text-destructive' : isLow ? 'text-warning' : 'text-primary'} />
                        <div>
                          <p className="font-bold text-lg">{item.productName}</p>
                          {item.productNameDioula && (
                            <p className="text-sm text-muted-foreground">{item.productNameDioula}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {(isLow || isCritical) && (
                      <AlertTriangle 
                        size={24} 
                        className={isCritical ? 'text-destructive' : 'text-warning'} 
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">
                        {quantity} <span className="text-lg text-muted-foreground">{item.unit}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seuil minimum: {threshold} {item.unit}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12"
                        onClick={() => handleRemove(item.productId, item.quantity, 1)}
                        disabled={updateStock.isPending}
                      >
                        <Minus size={24} />
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        className="h-12 w-12 bg-accent hover:bg-accent/90"
                        onClick={() => handleAdd(item.productId, item.quantity, 1)}
                        disabled={updateStock.isPending}
                      >
                        <Plus size={24} />
                      </Button>
                    </div>
                  </div>

                  {/* Boutons d'ajout rapide */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdd(item.productId, item.quantity, 5)}
                      disabled={updateStock.isPending}
                      className="flex-1"
                    >
                      +5
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdd(item.productId, item.quantity, 10)}
                      disabled={updateStock.isPending}
                      className="flex-1"
                    >
                      +10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdd(item.productId, item.quantity, 20)}
                      disabled={updateStock.isPending}
                      className="flex-1"
                    >
                      +20
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation mobile */}
      <MobileNavigation 
        activeItem="stock"
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
