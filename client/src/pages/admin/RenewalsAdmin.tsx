import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, Clock, CheckCircle2, X, FileText, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Page admin de gestion des demandes de renouvellement
 * Permet aux admins de :
 * - Voir toutes les demandes en attente
 * - Approuver ou rejeter les demandes
 * - Voir les statistiques globales
 */

export default function RenewalsAdmin() {
  const [selectedRenewal, setSelectedRenewal] = useState<any | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cnps' | 'cmu' | 'rsti'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Récupérer les statistiques
  const { data: stats } = trpc.socialProtection.getStats.useQuery();

  // Récupérer les demandes en attente
  const { data: renewals, isLoading, refetch } = trpc.socialProtection.listPending.useQuery({
    limit: 100,
    offset: 0,
    type: filterType,
  });

  // Mutations
  const approveMutation = trpc.socialProtection.approve.useMutation({
    onSuccess: () => {
      toast.success('Demande approuvée avec succès');
      setReviewDialogOpen(false);
      setSelectedRenewal(null);
      setAdminNotes('');
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const rejectMutation = trpc.socialProtection.reject.useMutation({
    onSuccess: () => {
      toast.success('Demande rejetée');
      setReviewDialogOpen(false);
      setSelectedRenewal(null);
      setAdminNotes('');
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleReview = (renewal: any, action: 'approve' | 'reject') => {
    setSelectedRenewal(renewal);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedRenewal) return;

    if (reviewAction === 'approve') {
      approveMutation.mutate({
        renewalId: selectedRenewal.id,
        adminNotes: adminNotes || undefined,
      });
    } else if (reviewAction === 'reject') {
      if (!adminNotes.trim()) {
        toast.error('Veuillez indiquer la raison du rejet');
        return;
      }
      rejectMutation.mutate({
        renewalId: selectedRenewal.id,
        adminNotes,
      });
    }
  };

  const filteredRenewals = renewals?.filter((renewal) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      renewal.merchantName?.toLowerCase().includes(query) ||
      renewal.businessName?.toLowerCase().includes(query) ||
      renewal.merchantNumber?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-orange-600" />
          Gestion des Renouvellements
        </h1>
        <p className="text-muted-foreground mt-2">
          Approuvez ou rejetez les demandes de renouvellement CNPS/CMU/RSTI
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.totalPending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approuvées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalApproved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejetées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.totalRejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Demandes en attente</CardTitle>
              <CardDescription>Traitez les demandes de renouvellement</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="cnps">CNPS</SelectItem>
                  <SelectItem value="cmu">CMU</SelectItem>
                  <SelectItem value="rsti">RSTI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, commerce ou numéro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredRenewals && filteredRenewals.length > 0 ? (
            <div className="space-y-4">
              {filteredRenewals.map((renewal) => (
                <div
                  key={renewal.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-semibold">
                        {renewal.type.toUpperCase()}
                      </Badge>
                      <span className="font-semibold">{renewal.merchantName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({renewal.merchantNumber})
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Commerce : {renewal.businessName}</p>
                      <p>
                        Demandé le {format(new Date(renewal.requestedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                      {renewal.currentExpiryDate && (
                        <p>
                          Expiration actuelle : {format(new Date(renewal.currentExpiryDate), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      )}
                      {renewal.requestedExpiryDate && (
                        <p className="font-medium text-foreground">
                          Nouvelle expiration demandée : {format(new Date(renewal.requestedExpiryDate), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      )}
                      {renewal.merchantNotes && (
                        <p className="italic">Note marchand : {renewal.merchantNotes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {renewal.proofDocumentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(renewal.proofDocumentUrl, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Voir justificatif
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleReview(renewal, 'approve')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleReview(renewal, 'reject')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Aucune demande trouvée'
                  : 'Aucune demande en attente'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de révision */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approuver' : 'Rejeter'} la demande
            </DialogTitle>
            <DialogDescription>
              {selectedRenewal && (
                <>
                  Demande de renouvellement {selectedRenewal.type.toUpperCase()} pour{' '}
                  <strong>{selectedRenewal.merchantName}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRenewal && (
            <div className="space-y-4 py-4">
              {/* Résumé de la demande */}
              <div className="p-4 bg-accent/50 rounded-lg space-y-2 text-sm">
                <p>
                  <strong>Commerce :</strong> {selectedRenewal.businessName}
                </p>
                <p>
                  <strong>Type :</strong> {selectedRenewal.type.toUpperCase()}
                </p>
                {selectedRenewal.currentExpiryDate && (
                  <p>
                    <strong>Expiration actuelle :</strong>{' '}
                    {format(new Date(selectedRenewal.currentExpiryDate), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                )}
                {selectedRenewal.requestedExpiryDate && (
                  <p>
                    <strong>Nouvelle expiration :</strong>{' '}
                    {format(new Date(selectedRenewal.requestedExpiryDate), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                )}
                {selectedRenewal.merchantNotes && (
                  <p>
                    <strong>Note marchand :</strong> {selectedRenewal.merchantNotes}
                  </p>
                )}
              </div>

              {/* Notes admin */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes">
                  Notes administrateur {reviewAction === 'reject' && '*'}
                </Label>
                <Textarea
                  id="adminNotes"
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Commentaires optionnels...'
                      : 'Veuillez indiquer la raison du rejet...'
                  }
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false);
                setSelectedRenewal(null);
                setAdminNotes('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? 'Traitement...'
                : reviewAction === 'approve'
                ? 'Approuver'
                : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
