import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Users, Plus, Trash2, Edit, Phone, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Beneficiaries() {
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  const [formData, setFormData] = useState({
    contactPhone: '',
    nickname: '',
  });

  const utils = trpc.useUtils();
  const { data: beneficiaries, isLoading } = trpc.beneficiaries.list.useQuery();

  const addMutation = trpc.beneficiaries.add.useMutation({
    onSuccess: () => {
      toast.success('Contact ajouté avec succès!');
      setIsAddDialogOpen(false);
      setFormData({ contactPhone: '', nickname: '' });
      utils.beneficiaries.list.invalidate();
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const updateMutation = trpc.beneficiaries.update.useMutation({
    onSuccess: () => {
      toast.success('Contact modifié avec succès!');
      setIsEditDialogOpen(false);
      setSelectedBeneficiary(null);
      utils.beneficiaries.list.invalidate();
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const removeMutation = trpc.beneficiaries.remove.useMutation({
    onSuccess: () => {
      toast.success('Contact supprimé avec succès!');
      setIsDeleteDialogOpen(false);
      setSelectedBeneficiary(null);
      utils.beneficiaries.list.invalidate();
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const handleAdd = () => {
    if (!formData.contactPhone) {
      toast.error('Veuillez entrer un numéro de téléphone');
      return;
    }
    addMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!selectedBeneficiary) return;
    updateMutation.mutate({
      id: selectedBeneficiary.id,
      nickname: formData.nickname || undefined,
    });
  };

  const handleDelete = () => {
    if (!selectedBeneficiary) return;
    removeMutation.mutate(selectedBeneficiary.id);
  };

  const openAddDialog = () => {
    setFormData({ contactPhone: '', nickname: '' });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (beneficiary: any) => {
    setSelectedBeneficiary(beneficiary);
    setFormData({
      contactPhone: beneficiary.contactPhone || '',
      nickname: beneficiary.nickname || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (beneficiary: any) => {
    setSelectedBeneficiary(beneficiary);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/merchant/wallet')}
        className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-100 text-gray-700 p-4 rounded-full shadow-lg transition-all"
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Mes Contacts</h1>
          <p className="text-xl text-gray-600">Gérer vos contacts favoris</p>
        </div>

        <div className="mb-6">
          <Button onClick={openAddDialog} size="lg" className="w-full h-16 text-lg">
            <Plus className="w-6 h-6 mr-2" />
            Ajouter un contact
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des contacts</CardTitle>
            <CardDescription>Vos contacts enregistrés pour les transferts rapides</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : beneficiaries && beneficiaries.length > 0 ? (
              <div className="space-y-4">
                {beneficiaries.map((beneficiary) => (
                  <div
                    key={beneficiary.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {beneficiary.nickname || beneficiary.contactName || 'Sans nom'}
                        </div>
                        <div className="text-gray-500 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {beneficiary.contactPhone || 'Numéro non disponible'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(beneficiary)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(beneficiary)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Aucun contact enregistré</p>
                <Button onClick={openAddDialog} className="mt-4" variant="outline">
                  Ajouter votre premier contact
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un contact</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau contact pour faciliter vos transferts futurs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Numéro de téléphone *</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="Ex: +225 0123456789"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  className="text-lg h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Nom/Surnom (optionnel)</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="Ex: Maman, Papa, Ami, etc."
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="text-lg h-12"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAdd} disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le contact</DialogTitle>
              <DialogDescription>Modifier le surnom de votre contact</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editNickname">Nom/Surnom</Label>
                <Input
                  id="editNickname"
                  type="text"
                  placeholder="Ex: Maman, Papa, Ami, etc."
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="text-lg h-12"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Modification...' : 'Modifier'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Le contact sera définitivement supprimé de
                votre liste.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={removeMutation.isPending}>
                {removeMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
