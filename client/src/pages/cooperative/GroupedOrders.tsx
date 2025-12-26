import { useState } from 'react';
import { PriceTiersDisplay } from '@/components/PriceTiersDisplay';
import { CountdownDisplay } from '@/components/CountdownTimer';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Plus,
  Users,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function GroupedOrders() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [joinQuantity, setJoinQuantity] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderToJoin, setOrderToJoin] = useState<number | null>(null);
  const [priceTiers, setPriceTiers] = useState<Array<{ minQuantity: string; discountPercent: string; pricePerUnit: string }>>([]);

  // Récupérer les commandes groupées (hardcoded cooperativeId pour l'exemple)
  const cooperativeId = 1;
  const { data: orders, refetch } = trpc.groupedOrders.getByCooperative.useQuery({ cooperativeId });
  const { data: participants } = trpc.groupedOrders.getParticipants.useQuery(
    { groupedOrderId: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );
  const { data: priceTiersData } = trpc.groupedOrders.getPriceTiers.useQuery(
    { groupedOrderId: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );
  const { data: currentPriceData } = trpc.groupedOrders.getCurrentPrice.useQuery(
    { groupedOrderId: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  // Mutations
  const createMutation = trpc.groupedOrders.create.useMutation({
    onSuccess: async (data) => {
      // Si des paliers ont été définis, les créer
      if (priceTiers.length > 0 && data.orderId) {
        await createTiersMutation.mutateAsync({
          groupedOrderId: data.orderId,
          tiers: priceTiers.map(tier => ({
            minQuantity: parseFloat(tier.minQuantity),
            discountPercent: parseFloat(tier.discountPercent),
            pricePerUnit: parseFloat(tier.pricePerUnit),
          })),
        });
      }
      setIsCreateDialogOpen(false);
      setProductName('');
      setUnitPrice('');
      setClosingDate('');
      setPriceTiers([]);
      refetch();
      alert('Commande groupée créée avec succès !');
    },
  });

  const createTiersMutation = trpc.groupedOrders.createPriceTiers.useMutation();

  const confirmMutation = trpc.groupedOrders.confirm.useMutation({
    onSuccess: () => {
      refetch();
      alert('Commande confirmée !');
    },
  });

  const joinMutation = trpc.groupedOrders.join.useMutation({
    onSuccess: () => {
      setIsJoinDialogOpen(false);
      setJoinQuantity('');
      setOrderToJoin(null);
      refetch();
      alert('Vous avez rejoint la commande avec succès !');
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  // Récupérer le marchand connecté
  const { data: myMerchant } = trpc.auth.myMerchant.useQuery();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
      confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle2 },
      delivered: { label: 'Livrée', color: 'bg-green-100 text-green-700 border-green-300', icon: Truck },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700 border-red-300', icon: Clock },
    };
    const info = statusMap[status] || statusMap.draft;
    const Icon = info.icon;
    return (
      <Badge className={`${info.color} border-2 gap-1`} variant="outline">
        <Icon className="h-3 w-3" />
        {info.label}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Commandes Groupées</h1>
          </div>
          
          {/* Bouton créer une commande */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle commande groupée
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une commande groupée</DialogTitle>
                <DialogDescription>
                  Consolidez les besoins de vos membres pour obtenir de meilleurs prix
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produit</Label>
                  <Input
                    id="product"
                    placeholder="Ex: Riz local, Huile de palme..."
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prix unitaire (FCFA)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="1000"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Prix de base avant réductions
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closingDate">Date limite de participation (optionnel)</Label>
                  <Input
                    id="closingDate"
                    type="datetime-local"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Crée l'urgence et ferme automatiquement la commande
                  </p>
                </div>

                {/* Section paliers de prix */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-indigo-600" />
                      Paliers de prix dégressifs (optionnel)
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPriceTiers([...priceTiers, { minQuantity: '', discountPercent: '', pricePerUnit: '' }]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter un palier
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Définissez des prix dégressifs pour encourager les commandes groupées
                  </p>

                  {priceTiers.map((tier, index) => (
                    <div key={index} className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Quantité min</Label>
                        <Input
                          type="number"
                          placeholder="50"
                          value={tier.minQuantity}
                          onChange={(e) => {
                            const newTiers = [...priceTiers];
                            newTiers[index].minQuantity = e.target.value;
                            setPriceTiers(newTiers);
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Réduction %</Label>
                        <Input
                          type="number"
                          placeholder="5"
                          value={tier.discountPercent}
                          onChange={(e) => {
                            const newTiers = [...priceTiers];
                            newTiers[index].discountPercent = e.target.value;
                            // Calculer automatiquement le prix réduit
                            if (unitPrice && e.target.value) {
                              const basePrice = parseFloat(unitPrice);
                              const discount = parseFloat(e.target.value);
                              newTiers[index].pricePerUnit = (basePrice * (1 - discount / 100)).toFixed(2);
                            }
                            setPriceTiers(newTiers);
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Prix unitaire</Label>
                        <Input
                          type="number"
                          placeholder="950"
                          value={tier.pricePerUnit}
                          onChange={(e) => {
                            const newTiers = [...priceTiers];
                            newTiers[index].pricePerUnit = e.target.value;
                            setPriceTiers(newTiers);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setPriceTiers(priceTiers.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  disabled={!productName || !unitPrice}
                  onClick={() => {
                    createMutation.mutate({
                      cooperativeId,
                      productName,
                      unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
                      closingDate: closingDate ? new Date(closingDate).toISOString() : undefined,
                    });
                  }}
                >
                  Créer la commande
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-gray-600">
          Regroupez les besoins de vos membres pour négocier de meilleurs prix
        </p>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-6">
        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune commande groupée pour le moment</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Créez votre première commande pour commencer
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-600" />
                      {order.productName}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Créée par {order.creatorName} le{' '}
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(order.status)}
                    {order.closingDate && order.status === 'draft' && (
                      <CountdownDisplay closingDate={new Date(order.closingDate)} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Statistiques */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Quantité totale</p>
                    <p className="text-2xl font-bold text-gray-900">{order.totalQuantity}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Prix unitaire</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {order.unitPrice ? `${parseFloat(order.unitPrice).toLocaleString('fr-FR')} FCFA` : '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Montant total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {order.totalAmount ? `${parseFloat(order.totalAmount).toLocaleString('fr-FR')} FCFA` : '-'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <Users className="h-4 w-4" />
                    Voir les participants
                  </Button>
                  
                  {order.status === 'draft' && (
                    <>
                      <Button
                        variant="secondary"
                        className="gap-2 bg-green-100 text-green-700 hover:bg-green-200"
                        onClick={() => {
                          setOrderToJoin(order.id);
                          setIsJoinDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Rejoindre la commande
                      </Button>
                      <Button
                        variant="default"
                        className="gap-2"
                        onClick={() => confirmMutation.mutate({ groupedOrderId: order.id })}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Confirmer la commande
                      </Button>
                    </>
                  )}
                </div>

                {/* Paliers de prix */}
                {selectedOrderId === order.id && priceTiersData && priceTiersData.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <PriceTiersDisplay
                      tiers={priceTiersData}
                      currentQuantity={order.totalQuantity}
                      basePrice={order.unitPrice ? parseFloat(order.unitPrice) : 0}
                      productName={order.productName}
                      activeTier={currentPriceData?.activeTier}
                      nextTier={currentPriceData?.nextTier}
                    />
                  </div>
                )}

                {/* Liste des participants */}
                {selectedOrderId === order.id && participants && participants.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participants ({participants.length})
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Marchand</TableHead>
                          <TableHead>Commerce</TableHead>
                          <TableHead className="text-right">Quantité</TableHead>
                          <TableHead className="text-right">Date d'adhésion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell className="font-medium">{participant.merchantName}</TableCell>
                            <TableCell>{participant.businessName}</TableCell>
                            <TableCell className="text-right font-semibold">{participant.quantity}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {new Date(participant.joinedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog pour rejoindre une commande */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejoindre la commande groupée</DialogTitle>
            <DialogDescription>
              Indiquez la quantité que vous souhaitez commander
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité souhaitée</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Ex: 50"
                value={joinQuantity}
                onChange={(e) => setJoinQuantity(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Plus la quantité totale est élevée, meilleur sera le prix négocié
              </p>
            </div>
            <Button
              className="w-full"
              disabled={!joinQuantity || !myMerchant || parseFloat(joinQuantity) <= 0}
              onClick={() => {
                if (orderToJoin && myMerchant) {
                  joinMutation.mutate({
                    groupedOrderId: orderToJoin,
                    merchantId: myMerchant.id,
                    quantity: parseFloat(joinQuantity),
                  });
                }
              }}
            >
              Rejoindre avec {joinQuantity || '0'} unités
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
