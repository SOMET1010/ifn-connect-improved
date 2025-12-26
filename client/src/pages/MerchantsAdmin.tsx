import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Users, 
  Phone, 
  CheckCircle, 
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';

export default function MerchantsAdmin() {
  // États pour les filtres
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [cooperative, setCooperative] = useState<string>('');
  const [hasPhone, setHasPhone] = useState<boolean | undefined>(undefined);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);

  // Requêtes tRPC
  const { data: stats, isLoading: statsLoading } = trpc.admin.getMerchantsStats.useQuery();
  
  const { data: merchantsData, isLoading: merchantsLoading } = trpc.admin.listMerchants.useQuery({
    page,
    limit: 50,
    search: search || undefined,
    cooperative: cooperative || undefined,
    hasPhone,
    isVerified,
  });

  const { data: cooperatives } = trpc.admin.getMarketDistribution.useQuery();

  // Fonction d'export CSV
  const handleExportCSV = () => {
    if (!merchantsData?.merchants) return;

    const headers = [
      'ID',
      'Numéro Marchand',
      'Nom',
      'Type',
      'Coopérative',
      'Téléphone',
      'Email',
      'Vérifié',
      'CNPS',
      'CMU',
      'Date création'
    ];

    const rows = merchantsData.merchants.map(m => [
      m.id,
      m.merchantNumber,
      m.businessName,
      m.businessType || '',
      m.location || '',
      m.userPhone || '',
      m.userEmail || '',
      m.isVerified ? 'Oui' : 'Non',
      m.cnpsStatus || '',
      m.cmuStatus || '',
      new Date(m.createdAt).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `marchands_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearch('');
    setCooperative('');
    setHasPhone(undefined);
    setIsVerified(undefined);
    setPage(1);
  };

  // Compter les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (cooperative) count++;
    if (hasPhone !== undefined) count++;
    if (isVerified !== undefined) count++;
    return count;
  }, [search, cooperative, hasPhone, isVerified]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Gestion des Marchands</h1>
          <p className="text-gray-600 mt-2">
            Administration et suivi de tous les marchands de la plateforme
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={!merchantsData?.merchants.length}>
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistiques */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Marchands</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avec Téléphone</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.withPhone || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.total ? Math.round((stats.withPhone / stats.total) * 100) : 0}%
                </p>
              </div>
              <Phone className="w-10 h-10 text-green-500" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vérifiés</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.verified || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.total ? Math.round((stats.verified / stats.total) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coopératives</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.cooperatives || 0}</p>
              </div>
              <Building2 className="w-10 h-10 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Filtres</h2>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}</Badge>
          )}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="ml-auto">
              <X className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher (nom, ID, tél...)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Coopérative */}
          <Select value={cooperative} onValueChange={(value) => {
            setCooperative(value);
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les coopératives" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les coopératives</SelectItem>
              {cooperatives?.map((coop) => (
                <SelectItem key={coop.market} value={coop.market || ''}>
                  {coop.market} ({coop.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Téléphone */}
          <Select value={hasPhone === undefined ? '' : hasPhone.toString()} onValueChange={(value) => {
            setHasPhone(value === '' ? undefined : value === 'true');
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Téléphone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              <SelectItem value="true">Avec téléphone</SelectItem>
              <SelectItem value="false">Sans téléphone</SelectItem>
            </SelectContent>
          </Select>

          {/* Vérification */}
          <Select value={isVerified === undefined ? '' : isVerified.toString()} onValueChange={(value) => {
            setIsVerified(value === '' ? undefined : value === 'true');
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Vérification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              <SelectItem value="true">Vérifiés</SelectItem>
              <SelectItem value="false">Non vérifiés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Numéro Marchand</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Coopérative</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>CNPS</TableHead>
                <TableHead>CMU</TableHead>
                <TableHead>Date création</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchantsLoading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : merchantsData?.merchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    Aucun marchand trouvé
                  </TableCell>
                </TableRow>
              ) : (
                merchantsData?.merchants.map((merchant) => (
                  <TableRow key={merchant.id}>
                    <TableCell className="font-mono text-sm">{merchant.id}</TableCell>
                    <TableCell className="font-mono text-sm">{merchant.merchantNumber}</TableCell>
                    <TableCell className="font-medium">{merchant.businessName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{merchant.location || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {merchant.userPhone || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {merchant.isVerified ? (
                        <Badge className="bg-green-100 text-green-800">Vérifié</Badge>
                      ) : (
                        <Badge variant="secondary">Non vérifié</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={merchant.cnpsStatus === 'active' ? 'default' : 'secondary'}
                        className={merchant.cnpsStatus === 'active' ? 'bg-blue-100 text-blue-800' : ''}
                      >
                        {merchant.cnpsStatus || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={merchant.cmuStatus === 'active' ? 'default' : 'secondary'}
                        className={merchant.cmuStatus === 'active' ? 'bg-blue-100 text-blue-800' : ''}
                      >
                        {merchant.cmuStatus || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(merchant.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {merchantsData && merchantsData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-600">
              Page {merchantsData.pagination.page} sur {merchantsData.pagination.totalPages}
              {' · '}
              {merchantsData.pagination.total} marchand{merchantsData.pagination.total > 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= merchantsData.pagination.totalPages}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
