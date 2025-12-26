import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Filter,
  FileText,
  FileSpreadsheet,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { SalesChart } from '@/components/SalesChart';

export default function SalesHistory() {
  const [, setLocation] = useLocation();
  const { merchant } = useAuth();
  
  // États pour les filtres
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [productId, setProductId] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');

  // Récupérer les ventes avec filtres
  const { data: sales, isLoading } = trpc.sales.history.useQuery(
    {
      merchantId: merchant?.id || 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      productId: productId !== 'all' ? parseInt(productId) : undefined,
      limit: 1000, // Toutes les ventes pour l'export
    },
    { enabled: !!merchant }
  );

  // Récupérer la liste des produits pour le filtre
  const { data: products } = trpc.products.listByMerchant.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  // Statistiques calculées
  const stats = {
    totalSales: sales?.length || 0,
    totalAmount: sales?.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0) || 0,
    cashSales: sales?.filter(s => s.paymentMethod === 'cash').length || 0,
    mobileMoneySales: sales?.filter(s => s.paymentMethod === 'mobile_money').length || 0,
  };

  // Filtrer par méthode de paiement côté client
  const filteredSales = sales?.filter(sale => 
    paymentMethod === 'all' || sale.paymentMethod === paymentMethod
  ) || [];

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredSales || filteredSales.length === 0) {
      toast.error('Aucune vente à exporter');
      return;
    }

    const headers = ['Date', 'Produit', 'Quantité', 'Prix Unitaire', 'Total', 'Méthode de Paiement'];
    const rows = filteredSales.map(sale => [
      new Date(sale.saleDate).toLocaleDateString('fr-FR'),
      sale.productName || 'Produit inconnu',
      sale.quantity,
      `${parseFloat(sale.unitPrice).toLocaleString('fr-FR')} FCFA`,
      `${parseFloat(sale.totalAmount).toLocaleString('fr-FR')} FCFA`,
      sale.paymentMethod === 'cash' ? 'Espèces' : 
      sale.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Crédit'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Export CSV réussi');
  };

  // Export PDF (simplifié - génère un document texte formaté)
  const handleExportPDF = () => {
    if (!filteredSales || filteredSales.length === 0) {
      toast.error('Aucune vente à exporter');
      return;
    }

    // Pour un vrai PDF, il faudrait utiliser jspdf ou pdfmake
    // Ici on génère un fichier texte formaté
    const content = [
      '='.repeat(80),
      `HISTORIQUE DES VENTES - Marchand #${merchant?.id || 'N/A'}`,
      `Période: ${startDate || 'Début'} → ${endDate || 'Aujourd\'hui'}`,
      `Total ventes: ${stats.totalSales} | Montant total: ${stats.totalAmount.toLocaleString('fr-FR')} FCFA`,
      '='.repeat(80),
      '',
      ...filteredSales.map(sale => 
        `${new Date(sale.saleDate).toLocaleString('fr-FR')} | ` +
        `${sale.productName || 'Produit inconnu'} | ` +
        `Qté: ${sale.quantity} | ` +
        `${parseFloat(sale.totalAmount).toLocaleString('fr-FR')} FCFA | ` +
        `${sale.paymentMethod === 'cash' ? 'Espèces' : 
           sale.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Crédit'}`
      ),
      '',
      '='.repeat(80),
      `Document généré le ${new Date().toLocaleString('fr-FR')}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventes_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    toast.success('Export PDF réussi');
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setProductId('all');
    setPaymentMethod('all');
    toast.info('Filtres réinitialisés');
  };

  if (!merchant) {
    return (
      <div className="container mx-auto py-8">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/merchant/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Historique des Ventes
          </h1>
          <p className="text-gray-600 text-lg">
            Consultez et exportez l'historique complet de vos ventes
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Total Ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.totalSales}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Montant Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalAmount.toLocaleString('fr-FR')}
                <span className="text-lg ml-1">FCFA</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                💵 Espèces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.cashSales}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                📱 Mobile Money
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.mobileMoneySales}</p>
            </CardContent>
          </Card>
        </div>

        {/* Graphique des ventes */}
        <div className="mb-8">
          <SalesChart merchantId={merchant.id} />
        </div>

        {/* Filtres */}
        <Card className="mb-8 border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-blue-600" />
              Filtres de Recherche
            </CardTitle>
            <CardDescription>
              Affinez votre recherche par date, produit et méthode de paiement
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Date de début */}
              <div>
                <Label htmlFor="startDate" className="text-base font-semibold mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Date de début
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Date de fin */}
              <div>
                <Label htmlFor="endDate" className="text-base font-semibold mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Date de fin
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Produit */}
              <div>
                <Label htmlFor="productId" className="text-base font-semibold mb-2 block">
                  Produit
                </Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Tous les produits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les produits</SelectItem>
                    {products?.map((product: any) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.nameFr || product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Méthode de paiement */}
              <div>
                <Label htmlFor="paymentMethod" className="text-base font-semibold mb-2 block">
                  Méthode de Paiement
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Toutes les méthodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les méthodes</SelectItem>
                    <SelectItem value="cash">💵 Espèces</SelectItem>
                    <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                    <SelectItem value="credit">💳 Crédit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-4 mt-6">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="h-12"
              >
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>

              <Button
                onClick={handleExportCSV}
                className="h-12 bg-green-600 hover:bg-green-700"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>

              <Button
                onClick={handleExportPDF}
                className="h-12 bg-red-600 hover:bg-red-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des ventes */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              Liste des Ventes ({filteredSales.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Chargement des ventes...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Aucune vente trouvée</p>
                <p className="text-gray-400">Modifiez les filtres pour voir plus de résultats</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Produit</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Quantité</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">Prix Unit.</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">Total</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(sale.saleDate).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-900">
                          {sale.productName || 'Produit inconnu'}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">
                          {sale.quantity}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-700">
                          {parseFloat(sale.unitPrice).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-green-600">
                          {parseFloat(sale.totalAmount).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-4 px-4 text-center">
                          {sale.paymentMethod === 'cash' && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              💵 Espèces
                            </Badge>
                          )}
                          {sale.paymentMethod === 'mobile_money' && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              📱 Mobile Money
                            </Badge>
                          )}
                          {sale.paymentMethod === 'credit' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              💳 Crédit
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
