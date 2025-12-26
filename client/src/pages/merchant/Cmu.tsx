import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  TrendingUp,
  Calendar,
  DollarSign,
  FileText,
  Calculator,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MerchantCmu() {
  const { data: cmuInfo } = trpc.merchantSocial.getCmuInfo.useQuery();
  const { data: reimbursements } = trpc.merchantSocial.getCmuReimbursements.useQuery({ limit: 10 });
  const { data: trend } = trpc.merchantSocial.getCmuTrend.useQuery();

  // État du simulateur
  const [careType, setCareType] = useState<string>('consultation');
  const [totalAmount, setTotalAmount] = useState(50000);

  const { data: simulation } = trpc.merchantSocial.simulateReimbursement.useQuery(
    {
      careType: careType as any,
      totalAmount,
    },
    { enabled: totalAmount > 0 }
  );

  // Calculer le countdown jusqu'à l'expiration
  const daysUntilExpiry = cmuInfo?.cmuExpiryDate
    ? Math.ceil((new Date(cmuInfo.cmuExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Labels pour les types de soins
  const careTypeLabels: Record<string, string> = {
    consultation: 'Consultation',
    hospitalization: 'Hospitalisation',
    medication: 'Médicaments',
    surgery: 'Chirurgie',
    dental: 'Soins dentaires',
    optical: 'Soins optiques',
    maternity: 'Maternité',
    emergency: 'Urgence',
    other: 'Autre',
  };

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">CMU - Santé</h1>
        </div>
        <p className="text-gray-600">Couverture Maladie Universelle</p>
      </div>

      {/* Statut et KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className={cmuInfo?.cmuStatus === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${cmuInfo?.cmuStatus === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Heart className={`h-6 w-6 ${cmuInfo?.cmuStatus === 'active' ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {cmuInfo?.cmuStatus === 'active' ? 'Actif' : cmuInfo?.cmuStatus === 'pending' ? 'En attente' : 'Inactif'}
                </p>
                <p className="text-sm text-gray-600">Statut CMU</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {cmuInfo?.totalReimbursed ? `${Math.round(cmuInfo.totalReimbursed).toLocaleString()} FCFA` : '0 FCFA'}
                </p>
                <p className="text-sm text-gray-600">Total remboursé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{cmuInfo?.cmuNumber || 'N/A'}</p>
                <p className="text-sm text-gray-600">Numéro CMU</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={daysUntilExpiry && daysUntilExpiry < 30 ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${daysUntilExpiry && daysUntilExpiry < 30 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Calendar className={`h-6 w-6 ${daysUntilExpiry && daysUntilExpiry < 30 ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {daysUntilExpiry !== null ? `${daysUntilExpiry} jours` : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Avant expiration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerte expiration proche */}
      {daysUntilExpiry !== null && daysUntilExpiry < 30 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">Votre couverture CMU expire bientôt !</p>
                <p className="text-sm text-orange-700">
                  Il vous reste {daysUntilExpiry} jours. Pensez à renouveler votre couverture santé.
                </p>
              </div>
              <Button className="ml-auto bg-orange-600 hover:bg-orange-700">
                Renouveler maintenant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique d'évolution */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des remboursements</CardTitle>
            <CardDescription>12 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="totalReimbursed" stroke="#ef4444" name="Montant (FCFA)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulateur de remboursement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Simulateur de remboursement
            </CardTitle>
            <CardDescription>Estimez votre remboursement CMU</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="careType">Type de soin</Label>
                <Select value={careType} onValueChange={setCareType}>
                  <SelectTrigger id="careType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(careTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Montant total des soins (FCFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  min={0}
                  step={1000}
                />
              </div>

              {simulation && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-3">Résultats de la simulation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Montant total :</span>
                      <span className="font-semibold text-red-900">{simulation.totalAmount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Taux de remboursement :</span>
                      <span className="font-semibold text-red-900">{simulation.reimbursementRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Montant remboursé :</span>
                      <span className="font-bold text-green-700 text-lg">{simulation.reimbursedAmount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Reste à charge :</span>
                      <span className="font-semibold text-red-900">{simulation.remainingAmount.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des remboursements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des remboursements</CardTitle>
          <CardDescription>10 derniers remboursements</CardDescription>
        </CardHeader>
        <CardContent>
          {reimbursements && reimbursements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type de soin</TableHead>
                  <TableHead>Montant total</TableHead>
                  <TableHead>Remboursé</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reimbursements.map((reimbursement) => (
                  <TableRow key={reimbursement.id}>
                    <TableCell>{new Date(reimbursement.careDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="capitalize">{careTypeLabels[reimbursement.careType]}</TableCell>
                    <TableCell className="font-semibold">{Math.round(Number(reimbursement.totalAmount)).toLocaleString()} FCFA</TableCell>
                    <TableCell className="font-bold text-green-700">{Math.round(Number(reimbursement.reimbursedAmount)).toLocaleString()} FCFA</TableCell>
                    <TableCell>{Math.round(Number(reimbursement.reimbursementRate))}%</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          reimbursement.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : reimbursement.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : reimbursement.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {reimbursement.status === 'paid'
                          ? 'Payé'
                          : reimbursement.status === 'approved'
                          ? 'Approuvé'
                          : reimbursement.status === 'pending'
                          ? 'En attente'
                          : 'Rejeté'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun remboursement enregistré</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
