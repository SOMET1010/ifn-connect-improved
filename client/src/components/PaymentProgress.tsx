import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, DollarSign, Users } from 'lucide-react';

interface PaymentProgressProps {
  totalParticipants: number;
  paidParticipants: number;
  totalAmount: number;
  percentagePaid: number;
  isFullyPaid: boolean;
}

export function PaymentProgress({
  totalParticipants,
  paidParticipants,
  totalAmount,
  percentagePaid,
  isFullyPaid,
}: PaymentProgressProps) {
  return (
    <Card className={`${isFullyPaid ? 'border-green-500 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className={`h-5 w-5 ${isFullyPaid ? 'text-green-600' : 'text-orange-600'}`} />
            Statut des paiements
          </CardTitle>
          {isFullyPaid ? (
            <Badge className="bg-green-600 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Complet
            </Badge>
          ) : (
            <Badge className="bg-orange-600 text-white">
              <Clock className="h-3 w-3 mr-1" />
              En cours
            </Badge>
          )}
        </div>
        <CardDescription>
          Suivi des contributions des participants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progression</span>
              <span className={`font-semibold ${isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}>
                {percentagePaid}%
              </span>
            </div>
            <Progress 
              value={percentagePaid} 
              className={`h-3 ${isFullyPaid ? 'bg-green-200' : 'bg-orange-200'}`}
            />
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-600">Participants payés</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {paidParticipants} / {totalParticipants}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-600">Montant collecté</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalAmount.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-gray-500">FCFA</p>
            </div>
          </div>

          {/* Message de statut */}
          {isFullyPaid ? (
            <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✅ Tous les participants ont payé ! La commande peut être confirmée.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">
                ⏳ En attente de {totalParticipants - paidParticipants} paiement(s) restant(s)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
