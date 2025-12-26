import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';

/**
 * Page de consultation des logs d'audit
 * Traçabilité complète des actions critiques
 */
export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');

  // Récupérer les logs avec pagination et filtres
  const { data, isLoading } = trpc.admin.getAuditLogs.useQuery({
    page,
    limit: 50,
    action: actionFilter || undefined,
    entity: entityFilter || undefined,
    search: search || undefined,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  /**
   * Formater la date
   */
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Obtenir la couleur selon l'action
   */
  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'approve':
        return 'bg-emerald-100 text-emerald-800';
      case 'reject':
        return 'bg-orange-100 text-orange-800';
      case 'export':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Traduire l'action
   */
  const translateAction = (action: string) => {
    const translations: Record<string, string> = {
      create: 'Création',
      update: 'Modification',
      delete: 'Suppression',
      login: 'Connexion',
      logout: 'Déconnexion',
      approve: 'Approbation',
      reject: 'Rejet',
      export: 'Export',
      import: 'Import',
    };
    return translations[action] || action;
  };

  /**
   * Traduire l'entité
   */
  const translateEntity = (entity: string) => {
    const translations: Record<string, string> = {
      merchants: 'Marchands',
      users: 'Utilisateurs',
      sales: 'Ventes',
      renewals: 'Renouvellements',
      badges: 'Badges',
      markets: 'Marchés',
      cooperatives: 'Coopératives',
      agents: 'Agents',
    };
    return translations[entity] || entity;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <InstitutionalHeader />

      <main className="container mx-auto px-4 py-12">
        {/* Titre */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Shield className="w-16 h-16 text-blue-600" />
            <h1 className="text-5xl font-bold text-gray-900">
              Logs d'Audit
            </h1>
          </div>
          <p className="text-2xl text-gray-700">
            Traçabilité complète des actions critiques
          </p>
        </div>

        {/* Filtres */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Filtre Action */}
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les actions</SelectItem>
                <SelectItem value="create">Création</SelectItem>
                <SelectItem value="update">Modification</SelectItem>
                <SelectItem value="delete">Suppression</SelectItem>
                <SelectItem value="approve">Approbation</SelectItem>
                <SelectItem value="reject">Rejet</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre Entité */}
            <Select
              value={entityFilter}
              onValueChange={(value) => {
                setEntityFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les entités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les entités</SelectItem>
                <SelectItem value="merchants">Marchands</SelectItem>
                <SelectItem value="users">Utilisateurs</SelectItem>
                <SelectItem value="sales">Ventes</SelectItem>
                <SelectItem value="renewals">Renouvellements</SelectItem>
                <SelectItem value="badges">Badges</SelectItem>
              </SelectContent>
            </Select>

            {/* Bouton Reset */}
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setActionFilter('');
                setEntityFilter('');
                setPage(1);
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </Card>

        {/* Table des logs */}
        <Card className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-2xl font-semibold text-gray-700">Chargement...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-2xl font-semibold text-gray-700">Aucun log trouvé</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilisateur</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Entité</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Détails</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {log.userName || `User #${log.userId}`}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                            {translateAction(log.action)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {translateEntity(log.entity)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {log.entityId || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {log.details ? (
                            <span className="cursor-help" title={log.details}>
                              {log.details.substring(0, 50)}...
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Page {page} sur {totalPages} ({data?.total} logs au total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
