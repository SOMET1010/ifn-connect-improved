import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCircle2,
  Trophy,
  Users,
  AlertTriangle,
  Package,
  ShoppingCart,
  Info,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading, refetch } = trpc.inAppNotifications.getAll.useQuery({
    page,
    limit: 50,
    unreadOnly,
  });

  const markAsReadMutation = trpc.inAppNotifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsReadMutation = trpc.inAppNotifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = trpc.inAppNotifications.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quiz_passed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'badge_earned':
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'challenge_received':
      case 'challenge_won':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'renewal_reminder':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'stock_alert':
        return <Package className="h-5 w-5 text-red-600" />;
      case 'order_status':
        return <ShoppingCart className="h-5 w-5 text-indigo-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quiz_passed: 'Quiz réussi',
      badge_earned: 'Badge obtenu',
      challenge_received: 'Défi reçu',
      challenge_won: 'Défi gagné',
      renewal_reminder: 'Rappel renouvellement',
      stock_alert: 'Alerte stock',
      order_status: 'Commande',
      system: 'Système',
    };
    return labels[type] || type;
  };

  const handleNotificationClick = (notification: any) => {
    // Marquer comme lue
    if (!notification.isRead) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }

    // Naviguer vers l'URL d'action si elle existe
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Chargement des notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bell className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            </div>
            <p className="text-gray-600">Toutes vos notifications en un seul endroit</p>
          </div>

          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={!unreadOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setUnreadOnly(false);
                setPage(1);
              }}
            >
              Toutes
            </Button>
            <Button
              variant={unreadOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setUnreadOnly(true);
                setPage(1);
              }}
            >
              Non lues
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      <Card>
        <CardHeader>
          <CardTitle>
            {data?.total || 0} notification{(data?.total || 0) > 1 ? 's' : ''}
          </CardTitle>
          <CardDescription>
            Page {data?.page} sur {data?.totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucune notification</p>
              {unreadOnly && (
                <p className="text-sm text-gray-500 mt-2">
                  Toutes vos notifications ont été lues
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {data.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                      notification.isRead
                        ? 'bg-white border-gray-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icône */}
                    <div className="flex-shrink-0 p-2 bg-white rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{notification.title}</p>
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs">
                            Nouveau
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Supprimer cette notification ?')) {
                            deleteMutation.mutate({ notificationId: notification.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Affichage de {(page - 1) * 50 + 1} à {Math.min(page * 50, data.total)} sur{' '}
                    {data.total} notifications
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
