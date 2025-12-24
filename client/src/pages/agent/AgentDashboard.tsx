import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { MapView } from '@/components/Map';
import {
  Users,
  TrendingUp,
  MapPin,
  Plus,
  Search,
  Calendar,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

export default function AgentDashboard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Récupérer les statistiques
  const { data: stats, isLoading: statsLoading } = trpc.agent.stats.useQuery();

  // Récupérer la liste des marchands
  const { data: merchantsData, isLoading: merchantsLoading } = trpc.agent.listMerchants.useQuery({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
  });

  // Récupérer les marchands pour la carte
  const { data: merchantsByMarket } = trpc.agent.merchantsByMarket.useQuery();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Agent Terrain</h1>
              <p className="text-gray-600 mt-1">Gestion des enrôlements marchands</p>
            </div>
            <Button
              size="lg"
              onClick={() => setLocation('/agent/enrollment')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Enrôler un Nouveau Marchand
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Enrôlements Aujourd'hui
              </CardTitle>
              <Calendar className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? '...' : stats?.enrollmentsToday || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">Nouveaux marchands</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Enrôlements ce Mois
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? '...' : stats?.enrollmentsThisMonth || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">Ce mois-ci</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Enrôlés
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? '...' : stats?.totalEnrollments || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">Tous les marchands</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Marchés Couverts
              </CardTitle>
              <MapPin className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? '...' : stats?.marketsCovered || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">Marchés actifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Carte interactive */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Carte des Enrôlements</CardTitle>
            <CardDescription>Localisation des marchands enrôlés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapView
                onMapReady={(map) => {
                  // Créer les markers pour chaque marchand avec GPS
                  const markers: any[] = [];
                  const infoWindows: any[] = [];

                  if (merchantsByMarket) {
                    Object.entries(merchantsByMarket).forEach(([marketName, merchants]) => {
                      merchants.forEach((merchant) => {
                        if (merchant.latitude && merchant.longitude) {
                          const marker = new (window as any).google.maps.Marker({
                            position: {
                              lat: parseFloat(merchant.latitude),
                              lng: parseFloat(merchant.longitude),
                            },
                            map,
                            title: merchant.businessName || merchant.userName,
                            icon: {
                              path: (window as any).google.maps.SymbolPath.CIRCLE,
                              scale: 8,
                              fillColor: '#ea580c',
                              fillOpacity: 0.8,
                              strokeColor: '#fff',
                              strokeWeight: 2,
                            },
                          });

                          const infoWindow = new (window as any).google.maps.InfoWindow({
                            content: `
                              <div style="padding: 8px; min-width: 200px;">
                                <h3 style="font-weight: bold; margin-bottom: 4px; color: #ea580c;">${merchant.merchantNumber}</h3>
                                <p style="margin: 4px 0;"><strong>${merchant.businessName || merchant.userName}</strong></p>
                                <p style="margin: 4px 0; color: #666;">📞 ${merchant.phone || 'N/A'}</p>
                                <p style="margin: 4px 0; color: #666;">📍 ${marketName}</p>
                                <p style="margin: 4px 0; font-size: 12px; color: #999;">Enrôlé le ${merchant.enrolledAt ? new Date(merchant.enrolledAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
                              </div>
                            `,
                          });

                          marker.addListener('click', () => {
                            // Fermer toutes les autres info windows
                            infoWindows.forEach((iw) => iw.close());
                            infoWindow.open(map, marker);
                          });

                          markers.push(marker);
                          infoWindows.push(infoWindow);
                        }
                      });
                    });
                  }

                  // Ajuster la vue pour afficher tous les markers
                  if (markers.length > 0) {
                    const bounds = new (window as any).google.maps.LatLngBounds();
                    markers.forEach((marker) => {
                      const position = marker.getPosition();
                      if (position) bounds.extend(position);
                    });
                    map.fitBounds(bounds);
                  } else {
                    // Par défaut, centrer sur Abidjan
                    map.setCenter({ lat: 5.3600, lng: -4.0083 });
                    map.setZoom(12);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des marchands */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Marchands Enrôlés</CardTitle>
                <CardDescription>Liste complète des marchands enregistrés</CardDescription>
              </div>
              <div className="w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {merchantsLoading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : merchantsData?.merchants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun marchand trouvé
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Téléphone</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Marché</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">CNPS</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">CMU</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {merchantsData?.merchants.map((merchant) => (
                        <tr key={merchant.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm font-semibold text-orange-600">
                              {merchant.merchantNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{merchant.businessName}</div>
                              <div className="text-sm text-gray-500">{merchant.userName}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center text-gray-700">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {merchant.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center text-gray-700">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              {merchant.marketName || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(merchant.cnpsStatus || 'pending')}
                              <span className="text-sm">{getStatusText(merchant.cnpsStatus || 'pending')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(merchant.cmuStatus || 'pending')}
                              <span className="text-sm">{getStatusText(merchant.cmuStatus || 'pending')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {merchant.enrolledAt
                              ? new Date(merchant.enrolledAt).toLocaleDateString('fr-FR')
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {merchantsData && merchantsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Page {merchantsData.pagination.page} sur {merchantsData.pagination.totalPages}
                      {' · '}
                      {merchantsData.pagination.total} marchand(s) au total
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === merchantsData.pagination.totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
