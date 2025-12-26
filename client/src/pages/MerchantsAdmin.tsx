import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import MerchantEditModal from '@/components/MerchantEditModal';
import MerchantCreateModal from '@/components/MerchantCreateModal';
import MerchantIdentificationCard from '@/components/MerchantIdentificationCard';
import MerchantPhysicalCard from '@/components/MerchantPhysicalCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
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
  X,
  Edit,
  Mail,
  MapPin,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function MerchantsAdmin() {
  // États pour les filtres
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [cooperative, setCooperative] = useState<string>('');
  const [hasPhone, setHasPhone] = useState<boolean | undefined>(undefined);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);

  // États pour la sélection multiple
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // États pour les modals de documents
  const [ficheModalOpen, setFicheModalOpen] = useState(false);
  const [carteModalOpen, setCarteModalOpen] = useState(false);
  const [selectedMerchantForDoc, setSelectedMerchantForDoc] = useState<any>(null);

  // États pour le modal d'édition
  const [editingMerchantId, setEditingMerchantId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingMerchantId, setDeletingMerchantId] = useState<number | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const utils = trpc.useUtils();

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

  // Gestion de la sélection
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (!merchantsData?.merchants) return;
    
    if (selectedIds.size === merchantsData.merchants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(merchantsData.merchants.map(m => m.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Mutations pour les actions en masse
  const bulkVerify = trpc.admin.bulkVerify.useMutation({
    onSuccess: () => {
      toast.success(`${selectedIds.size} marchand(s) vérifié(s)`);
      utils.admin.listMerchants.invalidate();
      clearSelection();
    },
    onError: (error: any) => toast.error(`Erreur: ${error.message}`),
  });

  const bulkSendSMS = trpc.admin.bulkSendSMS.useMutation({
    onSuccess: () => {
      toast.success(`SMS envoyé à ${selectedIds.size} marchand(s)`);
      clearSelection();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMerchant = trpc.admin.deleteMerchant.useMutation({
    onSuccess: () => {
      toast.success('Marchand supprimé avec succès');
      utils.admin.listMerchants.invalidate();
      utils.admin.getMerchantsStats.invalidate();
      setDeletingMerchantId(null);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const bulkDeleteMerchants = trpc.admin.bulkDeleteMerchants.useMutation({
    onSuccess: () => {
      toast.success(`${selectedIds.size} marchand(s) supprimé(s)`);
      utils.admin.listMerchants.invalidate();
      utils.admin.getMerchantsStats.invalidate();
      clearSelection();
      setShowBulkDeleteConfirm(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Actions en masse
  const handleBulkVerify = () => {
    if (selectedIds.size === 0) {
      toast.error('Aucun marchand sélectionné');
      return;
    }
    bulkVerify.mutate({ merchantIds: Array.from(selectedIds) });
  };

  const handleBulkSendSMS = () => {
    if (selectedIds.size === 0) {
      toast.error('Aucun marchand sélectionné');
      return;
    }
    bulkSendSMS.mutate({ merchantIds: Array.from(selectedIds), message: 'Bienvenue sur IFN Connect!' });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      toast.error('Aucun marchand sélectionné');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMerchants.mutate({ merchantIds: Array.from(selectedIds) });
  };

  const handleDeleteMerchant = (merchantId: number) => {
    setDeletingMerchantId(merchantId);
  };

  const confirmDelete = () => {
    if (deletingMerchantId) {
      deleteMerchant.mutate({ merchantId: deletingMerchantId });
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.size === 0 || !merchantsData?.merchants) {
      toast.error('Aucun marchand sélectionné');
      return;
    }

    const selectedMerchants = merchantsData.merchants.filter(m => selectedIds.has(m.id));

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

    const rows = selectedMerchants.map(m => [
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
    link.download = `marchands_selection_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success(`${selectedIds.size} marchand(s) exporté(s)`);
  };

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
        <div className="flex gap-3">
          <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un marchand
          </Button>
          <Button onClick={handleExportCSV} disabled={!merchantsData?.merchants.length}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
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
          <Select value={cooperative || 'all'} onValueChange={(value) => {
            setCooperative(value === 'all' ? '' : value);
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les coopératives" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les coopératives</SelectItem>
              {cooperatives?.map((coop) => (
                <SelectItem key={coop.market} value={coop.market || ''}>
                  {coop.market} ({coop.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Téléphone */}
          <Select value={hasPhone === undefined ? 'all' : hasPhone.toString()} onValueChange={(value) => {
            setHasPhone(value === 'all' ? undefined : value === 'true');
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Téléphone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="true">Avec téléphone</SelectItem>
              <SelectItem value="false">Sans téléphone</SelectItem>
            </SelectContent>
          </Select>

          {/* Vérification */}
          <Select value={isVerified === undefined ? 'all' : isVerified.toString()} onValueChange={(value) => {
            setIsVerified(value === 'all' ? undefined : value === 'true');
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Vérification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
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
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size > 0 && selectedIds.size === merchantsData?.merchants.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Numéro Marchand</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Coopérative</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>CNPS</TableHead>
                <TableHead>CMU</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchantsLoading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(11)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : merchantsData?.merchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                    Aucun marchand trouvé
                  </TableCell>
                </TableRow>
              ) : (
                merchantsData?.merchants.map((merchant) => (
                  <TableRow key={merchant.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(merchant.id)}
                        onCheckedChange={() => toggleSelect(merchant.id)}
                      />
                    </TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMerchantForDoc(merchant);
                            setFicheModalOpen(true);
                          }}
                          title="Fiche d'identification"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMerchantForDoc(merchant);
                            setCarteModalOpen(true);
                          }}
                          title="Carte physique"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMerchantId(merchant.id)}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMerchant(merchant.id)}
                          title="Supprimer"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

      {/* Barre d'actions flottante */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-gray-900">
              {selectedIds.size} marchand{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-8 w-px bg-gray-300" />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkVerify}
              disabled={bulkVerify.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Vérifier
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkSendSMS}
              disabled={bulkSendSMS.isPending}
            >
              <Mail className="w-4 h-4 mr-2" />
              Envoyer SMS
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSelected}
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMerchants.isPending}
              className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {editingMerchantId && (
        <MerchantEditModal
          merchantId={editingMerchantId}
          open={editingMerchantId !== null}
          onClose={() => setEditingMerchantId(null)}
          onSuccess={() => {
            utils.admin.listMerchants.invalidate();
            utils.admin.getMerchantsStats.invalidate();
          }}
        />
      )}

      {/* Modal Fiche d'identification */}
      <Dialog open={ficheModalOpen} onOpenChange={setFicheModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Fiche d'Identification PNAVIM-CI</DialogTitle>
          </DialogHeader>
          {selectedMerchantForDoc && (
            <MerchantIdentificationCard merchant={selectedMerchantForDoc} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Carte physique */}
      <Dialog open={carteModalOpen} onOpenChange={setCarteModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Carte Physique PNAVIM-CI</DialogTitle>
          </DialogHeader>
          {selectedMerchantForDoc && (
            <MerchantPhysicalCard merchant={selectedMerchantForDoc} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Création marchand */}
      <MerchantCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          utils.admin.listMerchants.invalidate();
          utils.admin.getMerchantsStats.invalidate();
        }}
      />

      {/* Modal Confirmation suppression individuelle */}
      <Dialog open={deletingMerchantId !== null} onOpenChange={() => setDeletingMerchantId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer ce marchand ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingMerchantId(null)}
              disabled={deleteMerchant.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteMerchant.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMerchant.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmation suppression en masse */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmer la suppression en masse
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer <strong>{selectedIds.size} marchand(s)</strong> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
              disabled={bulkDeleteMerchants.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMerchants.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleteMerchants.isPending ? 'Suppression...' : `Supprimer ${selectedIds.size} marchand(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
