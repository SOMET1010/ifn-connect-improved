import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileSpreadsheet, 
  MapPin, 
  Phone, 
  Calendar,
  Filter,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function MerchantList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarket, setFilterMarket] = useState('all');
  const [filterCnpsStatus, setFilterCnpsStatus] = useState('all');
  const [filterCmuStatus, setFilterCmuStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Récupérer tous les marchands
  const { data: merchantsData, isLoading } = trpc.agent.listMerchants.useQuery({
    page: currentPage,
    limit: 1000, // Récupérer tous pour le filtrage côté client
  });

  // Récupérer les marchés pour le filtre
  const { data: marketsByMarket } = trpc.agent.merchantsByMarket.useQuery();

  // Liste des marchés uniques
  const marketNames = useMemo(() => {
    if (!marketsByMarket) return [];
    return Object.keys(marketsByMarket).sort();
  }, [marketsByMarket]);

  // Filtrer les marchands
  const filteredMerchants = useMemo(() => {
    if (!merchantsData?.merchants) return [];

    let filtered = merchantsData.merchants;

    // Filtre par recherche (nom, téléphone, code MRC)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m: any) =>
        m.businessName?.toLowerCase().includes(query) ||
        m.phone?.toLowerCase().includes(query) ||
        m.merchantNumber?.toLowerCase().includes(query) ||
        m.userName?.toLowerCase().includes(query)
      );
    }

    // Filtre par marché
    if (filterMarket !== 'all') {
      filtered = filtered.filter((m: any) => m.marketName === filterMarket);
    }

    // Filtre par statut CNPS
    if (filterCnpsStatus !== 'all') {
      filtered = filtered.filter((m: any) => {
        if (filterCnpsStatus === 'active') return m.cnpsStatus === 'active';
        if (filterCnpsStatus === 'inactive') return m.cnpsStatus === 'inactive' || !m.cnpsStatus;
        return true;
      });
    }

    // Filtre par statut CMU
    if (filterCmuStatus !== 'all') {
      filtered = filtered.filter((m: any) => {
        if (filterCmuStatus === 'active') return m.cmuStatus === 'active';
        if (filterCmuStatus === 'inactive') return m.cmuStatus === 'inactive' || !m.cmuStatus;
        return true;
      });
    }

    return filtered;
  }, [merchantsData, searchQuery, filterMarket, filterCnpsStatus, filterCmuStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredMerchants.length / itemsPerPage);
  const paginatedMerchants = filteredMerchants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = filteredMerchants.map((merchant: any) => ({
      'Code MRC': merchant.merchantNumber || 'N/A',
      'Nom du Commerce': merchant.businessName || 'N/A',
      'Propriétaire': merchant.userName || 'N/A',
      'Téléphone': merchant.phone || 'N/A',
      'Marché': merchant.marketName || 'Inconnu',
      'Statut CNPS': merchant.cnpsStatus === 'active' ? 'Actif' : 'Inactif',
      'Statut CMU': merchant.cmuStatus === 'active' ? 'Actif' : 'Inactif',
      'Date d\'Enrôlement': merchant.enrolledAt 
        ? new Date(merchant.enrolledAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marchands');

    // Largeurs des colonnes
    worksheet['!cols'] = [
      { wch: 15 }, // Code MRC
      { wch: 25 }, // Nom du Commerce
      { wch: 25 }, // Propriétaire
      { wch: 15 }, // Téléphone
      { wch: 25 }, // Marché
      { wch: 18 }, // Statut CNPS
      { wch: 18 }, // Statut CMU
      { wch: 20 }, // Date d'Enrôlement
    ];

    const filename = `marchands-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Badge de statut
  const getStatusBadge = (status: string | null, type: 'cnps' | 'cmu') => {
    if (status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          ✓ Actif
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
        ✗ Inactif
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 shadow-sm">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <Users className="inline-block h-8 w-8 mr-2 text-orange-600" />
                Liste des Marchands Enrôlés
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredMerchants.length} marchand(s) trouvé(s)
              </p>
            </div>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="bg-white hover:bg-green-50 border-2 border-green-500 text-green-700 font-semibold"
              disabled={filteredMerchants.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exporter en Excel
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                {filteredMerchants.length}
              </Badge>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-6">
        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres de Recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Rechercher par nom, téléphone, code MRC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-orange-500"
              />
            </div>

            {/* Filtres avancés */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Marché
                </label>
                <select
                  value={filterMarket}
                  onChange={(e) => setFilterMarket(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                >
                  <option value="all">Tous les marchés</option>
                  {marketNames.map(market => (
                    <option key={market} value={market}>{market}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Statut CNPS
                </label>
                <select
                  value={filterCnpsStatus}
                  onChange={(e) => setFilterCnpsStatus(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Statut CMU
                </label>
                <select
                  value={filterCmuStatus}
                  onChange={(e) => setFilterCmuStatus(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des marchands */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                Chargement des marchands...
              </div>
            ) : filteredMerchants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucun marchand trouvé avec ces critères
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Code MRC</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Commerce</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Propriétaire</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Téléphone</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Marché</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">CNPS</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">CMU</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMerchants.map((merchant: any) => (
                        <tr key={merchant.id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm font-semibold text-orange-700">
                              {merchant.merchantNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{merchant.businessName || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{merchant.userName || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-gray-700">
                              <Phone className="h-3 w-3" />
                              {merchant.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-gray-700">
                              <MapPin className="h-3 w-3" />
                              {merchant.marketName || 'Inconnu'}
                            </div>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(merchant.cnpsStatus, 'cnps')}</td>
                          <td className="py-3 px-4">{getStatusBadge(merchant.cmuStatus, 'cmu')}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {merchant.enrolledAt
                                ? new Date(merchant.enrolledAt).toLocaleDateString('fr-FR')
                                : 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} sur {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
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
