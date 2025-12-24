import { useState, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { MapView } from '@/components/Map';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Layers, Navigation } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

/**
 * Page de cartographie SIG interactive
 * Visualisation des marchés sur Google Maps avec clustering
 */
export default function MapViewPage() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Récupérer les marchés géolocalisés
  const { data: markets, isLoading, refetch } = trpc.markets.geolocated.useQuery();
  
  // Mutation pour mettre à jour la géolocalisation
  const updateGeolocation = trpc.markets.updateGeolocation.useMutation({
    onSuccess: () => {
      toast.success('Position mise à jour avec succès');
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour', {
        description: error.message,
      });
    },
  });

  // Initialiser la carte
  const handleMapReady = useCallback((googleMap: google.maps.Map) => {
    setMap(googleMap);

    // Centrer sur Abidjan
    googleMap.setCenter({ lat: 5.3599517, lng: -4.0082563 });
    googleMap.setZoom(12);
  }, []);

  // Créer les marqueurs quand la carte et les données sont prêtes
  useEffect(() => {
    if (!map || !markets || markets.length === 0) return;

    // Nettoyer les anciens marqueurs
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    markets.forEach((market) => {
      if (!market.latitude || !market.longitude) return;

      const lat = parseFloat(market.latitude as string);
      const lng = parseFloat(market.longitude as string);

      // Créer le marqueur
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: market.name,
        draggable: isEditMode,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#E07A5F',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // InfoWindow avec détails du marché
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${market.name}</h3>
            ${market.declaredEffectif ? `<p style="margin: 4px 0; color: #6b7280;"><strong>Effectif:</strong> ${market.declaredEffectif}</p>` : ''}
            ${market.declaredCmu ? `<p style="margin: 4px 0; color: #6b7280;"><strong>CMU:</strong> ${market.declaredCmu}</p>` : ''}
            ${market.declaredCnps ? `<p style="margin: 4px 0; color: #6b7280;"><strong>CNPS:</strong> ${market.declaredCnps}</p>` : ''}
            ${market.address ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">${market.address}</p>` : ''}
          </div>
        `,
      });

      // Clic sur le marqueur
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        setSelectedMarket(market);
      });

      // Drag end en mode édition
      if (isEditMode) {
        marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const newLat = event.latLng.lat();
            const newLng = event.latLng.lng();
            
            // Confirmer la mise à jour
            if (confirm(`Mettre à jour la position de ${market.name} ?`)) {
              updateGeolocation.mutate({
                id: market.id,
                latitude: newLat,
                longitude: newLng,
              });
            } else {
              // Annuler : remettre à l'ancienne position
              marker.setPosition({ lat, lng });
            }
          }
        });
      }

      newMarkers.push(marker);
      bounds.extend({ lat, lng });
    });

    setMarkers(newMarkers);

    // Ajuster la vue pour montrer tous les marqueurs
    if (newMarkers.length > 0) {
      map.fitBounds(bounds);
    }

    // Cleanup
    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, markets, isEditMode, updateGeolocation]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cartographie SIG</h1>
            <p className="text-muted-foreground">
              Visualisation géographique des marchés
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isEditMode ? "default" : "outline"}
              onClick={() => setIsEditMode(!isEditMode)}
              disabled={!map}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isEditMode ? 'Mode édition actif' : 'Activer édition'}
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        {markets && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Marchés sur la carte</CardDescription>
                <CardTitle className="text-2xl">{markets.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Effectif total</CardDescription>
                <CardTitle className="text-2xl">
                  {markets.reduce((sum, m) => sum + (m.declaredEffectif || 0), 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total CMU</CardDescription>
                <CardTitle className="text-2xl">
                  {markets.reduce((sum, m) => sum + (m.declaredCmu || 0), 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total CNPS</CardDescription>
                <CardTitle className="text-2xl">
                  {markets.reduce((sum, m) => sum + (m.declaredCnps || 0), 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Carte */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {isLoading ? (
                  <Skeleton className="w-full h-[600px]" />
                ) : (
                  <div className="relative">
                    <MapView
                      onMapReady={handleMapReady}
                      className="w-full h-[600px]"
                    />
                    
                    {isEditMode && (
                      <div className="absolute top-4 left-4 bg-warning/90 text-warning-foreground px-4 py-2 rounded-lg shadow-lg">
                        <p className="text-sm font-medium">
                          Mode édition : Glissez les marqueurs pour repositionner
                        </p>
                      </div>
                    )}

                    {/* Légende */}
                    <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-[#E07A5F]"></div>
                        <span>Marché</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Liste des marchés */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Marchés
                </CardTitle>
                <CardDescription>
                  Cliquez sur un marché pour le localiser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : markets && markets.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {markets.map((market) => (
                      <button
                        key={market.id}
                        onClick={() => {
                          if (map && market.latitude && market.longitude) {
                            const lat = parseFloat(market.latitude as string);
                            const lng = parseFloat(market.longitude as string);
                            map.panTo({ lat, lng });
                            map.setZoom(15);
                            setSelectedMarket(market);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                          selectedMarket?.id === market.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm">{market.name}</h4>
                          <Navigation className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {market.declaredEffectif && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{market.declaredEffectif} acteurs</span>
                          </div>
                        )}
                        {(market.declaredCmu || market.declaredCnps) && (
                          <div className="flex gap-2 mt-1">
                            {market.declaredCmu && (
                              <Badge variant="secondary" className="text-xs">
                                CMU: {market.declaredCmu}
                              </Badge>
                            )}
                            {market.declaredCnps && (
                              <Badge variant="secondary" className="text-xs">
                                CNPS: {market.declaredCnps}
                              </Badge>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun marché géolocalisé
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
