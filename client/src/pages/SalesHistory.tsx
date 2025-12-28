import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, Filter, TrendingUp, DollarSign, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export function SalesHistory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // États pour les filtres
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  
  const pageSize = 20;

  // Récupérer le marchand
  const { data: merchant } = trpc.auth.myMerchant.useQuery();
  
  // Récupérer les produits pour le filtre
  const { data: products = [] } = trpc.products.listByMerchant.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  // Convertir les dates string en objets Date
  const filters = useMemo(() => ({
    merchantId: merchant?.id || 0,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    productId: selectedProductId !== 'all' ? parseInt(selectedProductId) : undefined,
    paymentMethod: selectedPaymentMethod !== 'all' ? selectedPaymentMethod as 'cash' | 'mobile_money' | 'credit' : undefined,
    limit: pageSize,
    offset: currentPage * pageSize,
  }), [merchant?.id, startDate, endDate, selectedProductId, selectedPaymentMethod, currentPage]);

  // Récupérer l'historique des ventes
  const { data, isLoading } = trpc.sales.historyWithFilters.useQuery(
    filters,
    { enabled: !!merchant }
  );

  // Fonction d'export CSV
  const handleExportCSV = () => {
    if (!data?.sales || data.sales.length === 0) return;

    // En-têtes CSV
    const headers = ['Date', 'Produit', 'Quantité', 'Prix unitaire', 'Total', 'Paiement'];
    
    // Lignes de données
    const rows = data.sales.map(sale => [
      new Date(sale.saleDate).toLocaleDateString('fr-FR'),
      sale.productName || 'Produit inconnu',
      sale.quantity.toString(),
      `${sale.unitPrice} FCFA`,
      `${sale.totalAmount} FCFA`,
      sale.paymentMethod === 'cash' ? 'Espèces' : 
        sale.paymentMethod === 'mobile_money' ? `Mobile Money (${sale.paymentProvider || 'N/A'})` : 
        'Crédit',
    ]);

    // Construire le CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique_ventes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedProductId('all');
    setSelectedPaymentMethod('all');
    setCurrentPage(0);
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>Vous devez être connecté pour accéder à cette page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 p-4 pb-24">
      {/* Header avec bouton retour */}
      <div className="max-w-7xl mx-auto mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/merchant/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Historique des ventes</h1>
            <p className="text-gray-600 mt-1">Consultez et analysez vos ventes passées</p>
          </div>
          <Button onClick={handleExportCSV} disabled={!data?.sales || data.sales.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      {data?.stats && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des ventes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">ventes enregistrées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Montant total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalAmount.toLocaleString()} FCFA</div>
              <p className="text-xs text-muted-foreground">chiffre d'affaires</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Montant moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(data.stats.averageAmount).toLocaleString()} FCFA</div>
              <p className="text-xs text-muted-foreground">par vente</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="max-w-7xl mx-auto mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtres de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtre date début */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date de début</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full"
              />
            </div>

            {/* Filtre date fin */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date de fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full"
              />
            </div>

            {/* Filtre produit */}
            <div>
              <label className="text-sm font-medium mb-2 block">Produit</label>
              <Select
                value={selectedProductId}
                onValueChange={(value) => {
                  setSelectedProductId(value);
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les produits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre méthode de paiement */}
            <div>
              <label className="text-sm font-medium mb-2 block">Méthode de paiement</label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={(value) => {
                  setSelectedPaymentMethod(value);
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les méthodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les méthodes</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="credit">Crédit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleResetFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des ventes */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle>
            Résultats ({data?.total || 0} ventes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : !data?.sales || data.sales.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune vente trouvée pour ces critères</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Prix unitaire</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Paiement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(sale.saleDate).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sale.productName || 'Produit inconnu'}</div>
                            {sale.productNameDioula && (
                              <div className="text-xs text-gray-500">{sale.productNameDioula}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{sale.quantity}</TableCell>
                        <TableCell className="text-right">{sale.unitPrice.toLocaleString()} FCFA</TableCell>
                        <TableCell className="text-right font-semibold">
                          {sale.totalAmount.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {sale.paymentMethod === 'cash' && '💵 Espèces'}
                            {sale.paymentMethod === 'mobile_money' && (
                              <div>
                                <div>📱 Mobile Money</div>
                                {sale.paymentProvider && (
                                  <div className="text-xs text-gray-500">{sale.paymentProvider}</div>
                                )}
                              </div>
                            )}
                            {sale.paymentMethod === 'credit' && '📝 Crédit'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage + 1} sur {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
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
  );
}
