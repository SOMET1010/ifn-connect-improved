import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ShoppingBag,
  Calendar
} from 'lucide-react';
import { toast as showToast } from 'sonner';

export default function OrderHistory() {
  const { merchant } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const utils = trpc.useUtils();

  // Récupérer les commandes
  const { data: orders, isLoading } = trpc.orders.listByMerchant.useQuery(
    { merchantId: merchant?.id || 0, limit: 100 },
    { enabled: !!merchant }
  );

  // Récupérer les statistiques
  const { data: stats } = trpc.orders.stats.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  // Mutation pour annuler une commande
  const cancelOrderMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      showToast.success("Commande annulée avec succès");
      utils.orders.listByMerchant.invalidate();
      utils.orders.stats.invalidate();
    },
    onError: (error) => {
      showToast.error(`Erreur: ${error.message}`);
    },
  });

  // Filtrer les commandes par statut
  const filteredOrders = orders?.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  ) || [];

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: 'En attente', className: 'bg-orange-100 text-orange-700', icon: Clock },
      confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      delivered: { label: 'Livrée', className: 'bg-green-100 text-green-700', icon: Package },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-700', icon: XCircle },
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {variant.label}
      </Badge>
    );
  };

  // Fonction pour annuler une commande
  const handleCancelOrder = (orderId: number) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      cancelOrderMutation.mutate({ orderId, status: 'cancelled' });
    }
  };

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accès Refusé</CardTitle>
            <CardDescription>Vous devez être enregistré comme marchand.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 shadow-sm">
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold text-gray-900">📦 Historique des Commandes</h1>
          <p className="text-gray-600 mt-1">Suivez toutes vos commandes de réapprovisionnement</p>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Dépensé</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {(stats?.totalSpent || 0).toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Toutes les commandes confondues
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Nombre de Commandes</CardTitle>
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.orderCount || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Commandes passées au total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrer par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                Toutes ({orders?.length || 0})
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                className={statusFilter === 'pending' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                En attente ({orders?.filter(o => o.status === 'pending').length || 0})
              </Button>
              <Button
                variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('confirmed')}
                className={statusFilter === 'confirmed' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Confirmées ({orders?.filter(o => o.status === 'confirmed').length || 0})
              </Button>
              <Button
                variant={statusFilter === 'delivered' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('delivered')}
                className={statusFilter === 'delivered' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Livrées ({orders?.filter(o => o.status === 'delivered').length || 0})
              </Button>
              <Button
                variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('cancelled')}
                className={statusFilter === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Annulées ({orders?.filter(o => o.status === 'cancelled').length || 0})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des commandes */}
        <Card>
          <CardHeader>
            <CardTitle>Vos Commandes</CardTitle>
            <CardDescription>
              {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''} trouvée{filteredOrders.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">Chargement des commandes...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Aucune commande trouvée</p>
                <p className="text-sm mt-2">
                  {statusFilter === 'all' 
                    ? "Vous n'avez pas encore passé de commande"
                    : `Aucune commande avec le statut "${statusFilter}"`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{order.productName}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(order.orderDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Quantité :</span> {parseFloat(order.quantity)} unités
                          </div>
                          <div>
                            <span className="font-medium">Prix unitaire :</span> {parseFloat(order.unitPrice).toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                        {order.deliveryDate && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Livraison prévue :</span>{' '}
                            {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-orange-600">
                          {parseFloat(order.totalAmount).toLocaleString('fr-FR')} FCFA
                        </div>
                        {order.status === 'pending' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelOrderMutation.isPending}
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
