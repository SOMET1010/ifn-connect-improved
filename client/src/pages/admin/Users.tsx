import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Users as UsersIcon,
  Shield,
  Store,
  UserCog,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function UsersManagement() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<'admin' | 'merchant' | 'agent' | 'cooperative' | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'merchant' | 'agent' | 'cooperative'>('merchant');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  // Récupérer les utilisateurs
  const { data, isLoading, refetch } = trpc.adminUsers.getUsers.useQuery({
    page,
    limit: 50,
    role: roleFilter,
    search: search.trim() || undefined,
  });

  // Récupérer les statistiques
  const { data: stats } = trpc.adminUsers.getRoleStats.useQuery();

  // Mutations
  const updateRoleMutation = trpc.adminUsers.updateUserRole.useMutation({
    onSuccess: () => {
      refetch();
      setIsRoleDialogOpen(false);
      alert('Rôle mis à jour avec succès');
    },
    onError: (error) => {
      alert(`Erreur : ${error.message}`);
    },
  });

  const toggleStatusMutation = trpc.adminUsers.toggleUserStatus.useMutation({
    onSuccess: () => {
      refetch();
      alert('Statut mis à jour avec succès');
    },
    onError: (error) => {
      alert(`Erreur : ${error.message}`);
    },
  });

  const handleUpdateRole = () => {
    if (selectedUser) {
      updateRoleMutation.mutate({ userId: selectedUser, role: newRole });
    }
  };

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    if (confirm(`Voulez-vous ${currentStatus ? 'désactiver' : 'activer'} cet utilisateur ?`)) {
      toggleStatusMutation.mutate({ userId, isActive: !currentStatus });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'merchant':
        return <Store className="h-4 w-4" />;
      case 'agent':
        return <UserCog className="h-4 w-4" />;
      case 'cooperative':
        return <Building2 className="h-4 w-4" />;
      default:
        return <UsersIcon className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'agent':
        return 'default';
      case 'cooperative':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      merchant: 'Marchand',
      agent: 'Agent',
      cooperative: 'Coopérative',
    };
    return labels[role] || role;
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Chargement des utilisateurs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UsersIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        </div>
        <p className="text-gray-600">Gérer les rôles et les accès des utilisateurs</p>
      </div>

      {/* Statistiques par rôle */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.admin || 0}</p>
                <p className="text-sm text-gray-600">Administrateurs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Store className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.merchant || 0}</p>
                <p className="text-sm text-gray-600">Marchands</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <UserCog className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.agent || 0}</p>
                <p className="text-sm text-gray-600">Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.cooperative || 0}</p>
                <p className="text-sm text-gray-600">Coopératives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre par rôle */}
            <Select
              value={roleFilter || 'all'}
              onValueChange={(value) => {
                setRoleFilter(value === 'all' ? undefined : value as any);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="admin">Administrateurs</SelectItem>
                <SelectItem value="merchant">Marchands</SelectItem>
                <SelectItem value="agent">Agents</SelectItem>
                <SelectItem value="cooperative">Coopératives</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>
            Utilisateurs ({data?.total || 0})
          </CardTitle>
          <CardDescription>
            Page {data?.page} sur {data?.totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || 'Sans nom'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.email && <div>{user.email}</div>}
                          {user.phone && <div className="text-gray-600">{user.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(user.role)}
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.businessName ? (
                          <div className="text-sm">
                            <div className="font-medium">{user.businessName}</div>
                            {user.location && <div className="text-gray-600">{user.location}</div>}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3" />
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(user.lastSignedIn).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user.id);
                              setNewRole(user.role);
                              setIsRoleDialogOpen(true);
                            }}
                          >
                            Modifier rôle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                          >
                            {user.isActive ? 'Désactiver' : 'Activer'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Affichage de {(page - 1) * 50 + 1} à {Math.min(page * 50, data.total)} sur {data.total} utilisateurs
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= (data.totalPages || 1)}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de modification du rôle */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Sélectionnez le nouveau rôle pour cet utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="merchant">Marchand</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="cooperative">Coopérative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? 'Mise à jour...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
