import { useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function OrderTracking() {
  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id ? parseInt(params.id) : 0;

  const { data: order, isLoading } = trpc.orders.getDetails.useQuery({ orderId });

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'En attente', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
      confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle2 },
      preparing: { label: 'En préparation', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Package },
      in_transit: { label: 'En livraison', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: Truck },
      delivered: { label: 'Livrée', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle2 },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getTimelineSteps = (currentStatus: string) => {
    const allSteps = [
      { status: 'pending', label: 'Commande passée', icon: Clock },
      { status: 'confirmed', label: 'Confirmée', icon: CheckCircle2 },
      { status: 'preparing', label: 'En préparation', icon: Package },
      { status: 'in_transit', label: 'En livraison', icon: Truck },
      { status: 'delivered', label: 'Livrée', icon: CheckCircle2 },
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'in_transit', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return allSteps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Chargement de la commande...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold text-lg mb-2">Commande introuvable</p>
              <p className="text-gray-600">Cette commande n'existe pas ou vous n'y avez pas accès.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const timelineSteps = order.status === 'cancelled' ? [] : getTimelineSteps(order.status);

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Suivi de commande #{order.id}</h1>
        </div>
        <p className="text-gray-600">Suivez l'état de votre commande en temps réel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails de la commande */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statut actuel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <StatusIcon className="h-6 w-6" />
                Statut actuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`text-lg px-4 py-2 ${statusInfo.color} border-2`}>
                {statusInfo.label}
              </Badge>
              {order.status === 'cancelled' && (
                <p className="text-sm text-gray-600 mt-4">
                  Cette commande a été annulée. Contactez le support pour plus d'informations.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          {order.status !== 'cancelled' && (
            <Card>
              <CardHeader>
                <CardTitle>Progression de la commande</CardTitle>
                <CardDescription>Suivez les étapes de traitement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {timelineSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={step.status} className="flex items-start gap-4 mb-8 last:mb-0">
                        {/* Icône */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                              step.completed
                                ? 'bg-green-100 border-green-500'
                                : 'bg-gray-100 border-gray-300'
                            }`}
                          >
                            <StepIcon
                              className={`h-6 w-6 ${
                                step.completed ? 'text-green-600' : 'text-gray-400'
                              }`}
                            />
                          </div>
                          {/* Ligne verticale */}
                          {index < timelineSteps.length - 1 && (
                            <div
                              className={`absolute left-6 top-12 w-0.5 h-8 ${
                                step.completed ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                          )}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 pt-2">
                          <p
                            className={`font-semibold ${
                              step.completed ? 'text-gray-900' : 'text-gray-500'
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.active && (
                            <p className="text-sm text-gray-600 mt-1">En cours...</p>
                          )}
                          {step.completed && !step.active && (
                            <p className="text-sm text-green-600 mt-1">✓ Terminé</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Informations */}
        <div className="space-y-6">
          {/* Produit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Produit commandé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Produit</p>
                  <p className="font-semibold text-gray-900">{order.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantité</p>
                  <p className="font-semibold text-gray-900">
                    {order.quantity} {order.productUnit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prix unitaire</p>
                  <p className="font-semibold text-gray-900">{order.unitPrice} FCFA</p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Montant total</p>
                  <p className="font-bold text-lg text-indigo-600">{order.totalAmount} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dates importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Date de commande</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(order.orderDate).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {order.deliveryDate && (
                  <div>
                    <p className="text-sm text-gray-600">Date de livraison</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.deliveryDate).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fournisseur */}
          {order.cooperativeName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fournisseur</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-gray-900">{order.cooperativeName}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
