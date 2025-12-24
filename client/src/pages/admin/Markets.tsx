import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { MapPin, Users, Search, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Page de visualisation des marchés et acteurs enrôlés
 * Affiche les 8 marchés avec leurs statistiques
 */
export default function MarketsPage() {
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Récupérer tous les marchés
  const { data: markets, isLoading: marketsLoading } = trpc.markets.list.useQuery();
  
  // Récupérer les stats globales
  const { data: globalStats } = trpc.markets.globalStats.useQuery();

  // Récupérer les acteurs du marché sélectionné
  const { data: marketWithActors, isLoading: actorsLoading } = trpc.markets.withActors.useQuery(
    { marketId: selectedMarketId! },
    { enabled: selectedMarketId !== null }
  );

  // Filtrer les acteurs selon la recherche
  const filteredActors = marketWithActors?.actors.filter(actor => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      actor.fullName.toLowerCase().includes(query) ||
      actor.identifierCode?.toLowerCase().includes(query) ||
      actor.phone?.includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Marchés et Acteurs</h1>
          <p className="text-muted-foreground">
            Visualisation des données d'enrôlement
          </p>
        </div>

        {/* Statistiques globales */}
        {globalStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Marchés</CardDescription>
                <CardTitle className="text-3xl">{globalStats.totalMarkets}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Acteurs</CardDescription>
                <CardTitle className="text-3xl">{globalStats.totalActors}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Marchés Géolocalisés</CardDescription>
                <CardTitle className="text-3xl">
                  {globalStats.geolocatedMarkets}/{globalStats.totalMarkets}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des marchés */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marchés</CardTitle>
                <CardDescription>
                  Sélectionnez un marché pour voir ses acteurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {marketsLoading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : (
                  markets?.map((market) => (
                    <button
                      key={market.id}
                      onClick={() => setSelectedMarketId(market.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                        selectedMarketId === market.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{market.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {market.declaredEffectif && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{market.declaredEffectif}</span>
                              </div>
                            )}
                            {market.isGeolocated && (
                              <Badge variant="secondary" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                GPS
                              </Badge>
                            )}
                          </div>
                          {market.declaredCmu !== null && market.declaredCmu > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              CMU: {market.declaredCmu} | CNPS: {market.declaredCnps || 0}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Liste des acteurs */}
          <div className="lg:col-span-2">
            {selectedMarketId === null ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Sélectionnez un marché pour voir ses acteurs
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {marketWithActors?.name || 'Chargement...'}
                      </CardTitle>
                      <CardDescription>
                        {marketWithActors?.actorCount || 0} acteurs enrôlés
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Barre de recherche */}
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, carte ou téléphone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {actorsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : filteredActors && filteredActors.length > 0 ? (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {filteredActors.map((actor) => (
                        <div
                          key={actor.id}
                          className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{actor.fullName}</h4>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                {actor.identifierCode && (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {actor.identifierCode}
                                    </Badge>
                                  </div>
                                )}
                                {actor.phone && (
                                  <div>📱 {actor.phone}</div>
                                )}
                                {actor.actorKey && (
                                  <div className="text-xs opacity-70">
                                    {actor.actorKey}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'Aucun résultat trouvé' : 'Aucun acteur enrôlé'}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
