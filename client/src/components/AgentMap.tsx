import { useState, useCallback } from 'react';
import { MapView } from './Map';
import { Loader2 } from 'lucide-react';

interface Merchant {
  merchantNumber: string;
  businessName: string | null;
  userName: string | null;
  phone: string | null;
  latitude: string | null;
  longitude: string | null;
  enrolledAt: Date | null;
  marketName: string | null;
}

interface AgentMapProps {
  merchants: Record<string, Merchant[]>;
}

export function AgentMap({ merchants }: AgentMapProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleMapReady = useCallback(
    async (map: google.maps.Map) => {
      try {
        // Préparer les marqueurs
        const markers: google.maps.Marker[] = [];
        const bounds = new google.maps.LatLngBounds();

        // Couleurs par marché
        const marketColors: Record<string, string> = {};
        const colors = [
          '#FF6B6B', // Rouge
          '#4ECDC4', // Turquoise
          '#45B7D1', // Bleu
          '#FFA07A', // Saumon
          '#98D8C8', // Vert menthe
          '#F7DC6F', // Jaune
          '#BB8FCE', // Violet
          '#85C1E2', // Bleu clair
        ];

        let colorIndex = 0;

        // Créer les marqueurs pour chaque marchand
        Object.entries(merchants).forEach(([marketName, merchantList]) => {
          // Assigner une couleur au marché
          if (!marketColors[marketName]) {
            marketColors[marketName] = colors[colorIndex % colors.length];
            colorIndex++;
          }

          merchantList.forEach((merchant) => {
            if (!merchant.latitude || !merchant.longitude) return;

            const lat = parseFloat(merchant.latitude);
            const lng = parseFloat(merchant.longitude);

            if (isNaN(lat) || isNaN(lng)) return;

            const position = { lat, lng };

            // Créer un marqueur personnalisé avec SVG
            const markerColor = marketColors[marketName];
            const svgMarker = {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: markerColor,
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8,
            };

            const marker = new google.maps.Marker({
              position,
              map,
              icon: svgMarker,
              title: merchant.businessName || merchant.userName,
            });

            // InfoWindow avec détails du marchand
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 12px; min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
                  <div style="border-bottom: 2px solid ${markerColor}; padding-bottom: 8px; margin-bottom: 8px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
                      ${merchant.businessName || 'Commerce'}
                    </h3>
                    <p style="margin: 0; font-size: 12px; color: #6b7280; font-weight: 600;">
                      ${merchant.merchantNumber}
                    </p>
                  </div>
                  
                  <div style="margin-bottom: 8px;">
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #374151;">
                      <strong>👤 Propriétaire:</strong> ${merchant.userName}
                    </p>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #374151;">
                      <strong>📱 Téléphone:</strong> ${merchant.phone}
                    </p>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #374151;">
                      <strong>📍 Marché:</strong> ${marketName}
                    </p>
                  </div>

                  ${merchant.enrolledAt ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                        Enrôlé le ${new Date(merchant.enrolledAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ` : ''}
                </div>
              `,
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            markers.push(marker);
            bounds.extend(position);
          });
        });

        // Ajuster la vue pour afficher tous les marqueurs
        if (markers.length > 0) {
          map.fitBounds(bounds);

          // Limiter le zoom maximum pour éviter un zoom trop proche
          const listener = google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom()! > 16) {
              map.setZoom(16);
            }
            google.maps.event.removeListener(listener);
          });
        } else {
          // Centrer sur Abidjan par défaut si aucun marchand
          map.setCenter({ lat: 5.3600, lng: -4.0083 });
          map.setZoom(12);
        }

        // Ajouter le clustering avec MarkerClusterer
        // @ts-ignore - MarkerClusterer est chargé via CDN
        if (typeof window !== 'undefined' && (window as any).markerClusterer && markers.length > 0) {
          // @ts-ignore
          new (window as any).markerClusterer.MarkerClusterer({
            map,
            markers,
            algorithm: new (window as any).markerClusterer.SuperClusterAlgorithm({ radius: 100 }),
            renderer: {
              render: ({ count, position }: any) => {
                // Cluster personnalisé avec couleur dégradée selon la taille
                const color = count > 20 ? '#dc2626' : count > 10 ? '#f59e0b' : '#3b82f6';
                
                return new google.maps.Marker({
                  position,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: color,
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                    scale: Math.min(count * 2, 40), // Taille proportionnelle au nombre
                  },
                  label: {
                    text: String(count),
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  },
                  zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
                });
              },
            },
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Erreur initialisation carte:', error);
        setIsLoading(false);
      }
    },
    [merchants]
  );

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Chargement de la carte...</p>
          </div>
        </div>
      )}
      <MapView
        onMapReady={handleMapReady}
        initialCenter={{ lat: 5.3600, lng: -4.0083 }}
        initialZoom={12}
      />
    </div>
  );
}
