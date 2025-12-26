import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MerchantCreateModal({ open, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [cooperative, setCooperative] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'A' | 'B' | 'C' | undefined>(undefined);
  const [isVerified, setIsVerified] = useState(false);

  const createMutation = trpc.admin.createMerchant.useMutation({
    onSuccess: () => {
      toast.success('Marchand créé avec succès');
      resetForm();
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetForm = () => {
    setName('');
    setCooperative('');
    setPhone('');
    setEmail('');
    setCategory(undefined);
    setIsVerified(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      cooperative: cooperative.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      category,
      isVerified,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau marchand</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Informations de base</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: TRAORÉ Aminata"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cooperative">Coopérative / Marché</Label>
                <Input
                  id="cooperative"
                  value={cooperative}
                  onChange={(e) => setCooperative(e.target.value)}
                  placeholder="Ex: COCOVICO"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 0707070707"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: aminata@example.com"
                />
              </div>
            </div>
          </div>

          {/* Catégorie et vérification */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Classification</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as 'A' | 'B' | 'C')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Catégorie A</SelectItem>
                    <SelectItem value="B">Catégorie B</SelectItem>
                    <SelectItem value="C">Catégorie C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="isVerified"
                  checked={isVerified}
                  onCheckedChange={(checked) => setIsVerified(checked as boolean)}
                />
                <Label htmlFor="isVerified" className="cursor-pointer">
                  Marchand vérifié
                </Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Création...' : 'Créer le marchand'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
