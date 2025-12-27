import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PiggyBank, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/sensoryToast';
import { motion } from 'framer-motion';

interface SavingsProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleAmount: number;
  suggestedAmount: number;
  merchantId: number;
  onConfirm: () => void;
}

export function SavingsProposalModal({
  isOpen,
  onClose,
  saleAmount,
  suggestedAmount,
  merchantId,
  onConfirm,
}: SavingsProposalModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { data: goals } = trpc.savings.getGoals.useQuery(
    { merchantId },
    { enabled: isOpen && !!merchantId }
  );
  const addDeposit = trpc.savings.addDeposit.useMutation();

  // Trouver la cagnotte Tabaski ou la première cagnotte active
  const targetGoal = goals?.find(g => g.name.includes('Tabaski')) || goals?.[0];

  const handleConfirm = async () => {
    if (!targetGoal) {
      toast.error('Aucune cagnotte disponible. Crée une cagnotte d\'abord !');
      return;
    }

    setIsAnimating(true);

    try {
      await addDeposit.mutateAsync({
        savingsGoalId: targetGoal.id,
        merchantId,
        amount: suggestedAmount,
        source: 'auto_suggestion',
        notes: `Épargne automatique après vente de ${saleAmount.toLocaleString('fr-FR')} FCFA`,
      });

      // Attendre la fin de l'animation
      setTimeout(() => {
        toast.success(`💰 ${suggestedAmount.toLocaleString('fr-FR')} FCFA ajoutés à ta cagnotte !`);
        onConfirm();
        onClose();
        setIsAnimating(false);
      }, 2000);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout à la cagnotte');
      setIsAnimating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center space-y-6">
          {/* Animation de pièces */}
          {isAnimating && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -50, x: Math.random() * 300, opacity: 1, rotate: 0 }}
                  animate={{
                    y: 400,
                    x: Math.random() * 300,
                    opacity: 0,
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: 'easeIn',
                  }}
                  className="absolute text-4xl"
                >
                  💰
                </motion.div>
              ))}
            </div>
          )}

          {/* Icône principale */}
          <motion.div
            animate={isAnimating ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, repeat: isAnimating ? Infinity : 0 }}
            className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center shadow-lg"
          >
            <PiggyBank className="w-12 h-12 text-white" />
          </motion.div>

          {/* Titre avec sparkles */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-3xl font-bold text-gray-800">Conseil Malin</h2>
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-lg text-gray-600">
              C'est une grosse vente ! 🎉
            </p>
          </div>

          {/* Message principal */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 space-y-3">
            <p className="text-xl text-gray-700">
              Veux-tu mettre{' '}
              <span className="text-3xl font-bold text-green-600">
                {suggestedAmount.toLocaleString('fr-FR')} FCFA
              </span>{' '}
              de côté ?
            </p>
            <p className="text-sm text-gray-600">
              {targetGoal ? (
                <>
                  Dans ta cagnotte{' '}
                  <span className="font-semibold text-green-700">"{targetGoal.name}"</span>
                </>
              ) : (
                'Crée une cagnotte pour commencer à épargner !'
              )}
            </p>
          </div>

          {/* Détails de la vente */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p>
              Vente du jour : <span className="font-semibold">{saleAmount.toLocaleString('fr-FR')} FCFA</span>
            </p>
            <p>
              Proposition : <span className="font-semibold">{((suggestedAmount / saleAmount) * 100).toFixed(0)}%</span> de la vente
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-14 text-lg"
              disabled={isAnimating}
            >
              Non merci
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              disabled={isAnimating || !targetGoal}
            >
              {isAnimating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    💫
                  </motion.div>
                  <span className="ml-2">En cours...</span>
                </>
              ) : (
                '✅ Vas-y SUTA, valide !'
              )}
            </Button>
          </div>

          {/* Message d'encouragement */}
          {!targetGoal && (
            <p className="text-xs text-orange-600">
              💡 Astuce : Va dans "Épargner" pour créer ta première cagnotte !
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
