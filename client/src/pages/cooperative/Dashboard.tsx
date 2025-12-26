import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  TrendingUp,
  Package,
  ShoppingCart,
  Building2,
  ShoppingBag,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  FileText,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CooperativeDashboard() {
  const { data: cooperativeInfo } = trpc.cooperativeDashboard.getCooperativeInfo.useQuery();
  const { data: members, isLoading: membersLoading } = trpc.cooperativeDashboard.getMembers.useQuery();
  const { data: consolidatedNeeds, isLoading: needsLoading } = trpc.cooperativeDashboard.getConsolidatedNeeds.useQuery();
  const { data: stats } = trpc.cooperativeDashboard.getAggregatedStats.useQuery();
  const { data: kpis } = trpc.cooperativeDashboard.getGroupedOrdersKPIs.useQuery();
  const { data: trend } = trpc.cooperativeDashboard.getGroupedOrdersTrend.useQuery({ months: 12 });
  const { data: topProducts } = trpc.cooperativeDashboard.getTopProducts.useQuery({ limit: 5 });
  const { data: stockAlerts } = trpc.cooperativeDashboard.getStockAlerts.useQuery();

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            {cooperativeInfo?.cooperativeName || 'Dashboard Coopérative'}
          </h1>
        </div>
        <p className="text-gray-600">Vue d'ensemble et consolidation des besoins des membres</p>
      </div>

      {/* Boutons d'action rapide */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <Link href="/cooperative/grouped-orders">
          <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg">
            <ShoppingBag className="h-5 w-5 mr-2" />
            Commandes groupées
          </Button>
        </Link>
        <Link href="/cooperative/savings-dashboard">
          <Button size="lg" variant="outline" className="border-2 border-green-600 text-green-600 hover:bg-green-50">
            <TrendingDown className="h-5 w-5 mr-2" />
            Mes économies
          </Button>
        </Link>
        <Button size="lg" variant="outline" className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50">
          <FileText className="h-5 w-5 mr-2" />
          Rapports PDF
        </Button>
      </div>

      {/* KPIs Commandes Groupées */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Commandes Groupées</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{kpis?.totalOrders || 0}</p>
                  <p className="text-sm text-gray-600">Total commandes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpis?.estimatedSavings ? `${Math.round(kpis.estimatedSavings).toLocaleString()} FCFA` : '0 FCFA'}
                  </p>
                  <p className="text-sm text-gray-600">Économies réalisées</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{kpis?.activeParticipants || 0}</p>
                  <p className="text-sm text-gray-600">Participants actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Package className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{kpis?.inTransitOrders || 0}</p>
                  <p className="text-sm text-gray-600">En transit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Évolution des commandes */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des commandes (12 mois)</CardTitle>
            <CardDescription>Volume et montant total par mois</CardDescription>
          </CardHeader>
          <CardContent>
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orderCount" stroke="#6366f1" name="Nombre de commandes" />
                  <Line type="monotone" dataKey="totalAmount" stroke="#10b981" name="Montant (FCFA)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top produits */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 produits commandés</CardTitle>
            <CardDescription>Par volume total</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="productName" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="totalQuantity" fill="#f59e0b" name="Quantité totale" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertes de stock */}
      {stockAlerts && stockAlerts.length > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Alertes de stock critique
            </CardTitle>
            <CardDescription>Produits en rupture chez plusieurs membres</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Membres affectés</TableHead>
                  <TableHead className="text-right">Stock moyen</TableHead>
                  <TableHead className="text-right">Stock min</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockAlerts.map((alert) => (
                  <TableRow key={alert.productId}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{alert.productName}</p>
                        <p className="text-xs text-gray-600">{alert.productCategory}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-orange-700">
                      {alert.merchantsAffected}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(alert.avgQuantity)} {alert.productUnit}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      {Math.round(alert.minQuantity)} {alert.productUnit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Statistiques agrégées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalMembers || 0}</p>
                <p className="text-sm text-gray-600">Membres actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalRevenue ? `${Math.round(stats.totalRevenue).toLocaleString()} FCFA` : '0 FCFA'}
                </p>
                <p className="text-sm text-gray-600">CA total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalStockQuantity ? Math.round(stats.totalStockQuantity).toLocaleString() : '0'}
                </p>
                <p className="text-sm text-gray-600">Quantité totale stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalSales || 0}</p>
                <p className="text-sm text-gray-600">Ventes totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des membres */}
        <Card>
          <CardHeader>
            <CardTitle>Membres de la coopérative</CardTitle>
            <CardDescription>
              {members?.length || 0} membre{(members?.length || 0) > 1 ? 's' : ''} actif{(members?.length || 0) > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Chargement des membres...</p>
              </div>
            ) : !members || members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun membre pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-all"
                  >
                    <div className="p-2 bg-indigo-100 rounded-full">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{member.businessName}</p>
                      <p className="text-sm text-gray-600">{member.businessType || 'Type non spécifié'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {member.location || 'Localisation non spécifiée'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Membre depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Besoins consolidés */}
        <Card>
          <CardHeader>
            <CardTitle>Besoins consolidés en stock</CardTitle>
            <CardDescription>Agrégation des stocks de tous les membres</CardDescription>
          </CardHeader>
          <CardContent>
            {needsLoading ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Chargement des besoins...</p>
              </div>
            ) : !consolidatedNeeds || consolidatedNeeds.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun stock enregistré</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Quantité totale</TableHead>
                    <TableHead className="text-right">Marchands</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidatedNeeds.map((need) => (
                    <TableRow key={need.productId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{need.productName}</p>
                          <p className="text-xs text-gray-600">{need.productCategory}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {Math.round(need.totalQuantity)} {need.productUnit}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {need.merchantCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
