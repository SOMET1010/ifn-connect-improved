import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  TrendingUp,
  Package,
  ShoppingCart,
  Building2,
} from 'lucide-react';
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
