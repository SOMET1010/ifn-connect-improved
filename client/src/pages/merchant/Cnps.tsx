import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  TrendingUp,
  Calendar,
  DollarSign,
  FileText,
  Calculator,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MerchantCnps() {
  const { data: cnpsInfo } = trpc.merchantSocial.getCnpsInfo.useQuery();
  const { data: payments } = trpc.merchantSocial.getCnpsPayments.useQuery({ limit: 10 });
  const { data: trend } = trpc.merchantSocial.getCnpsTrend.useQuery();

  // État du simulateur
  const [age, setAge] = useState(35);
  const [yearsContributed, setYearsContributed] = useState(10);
  const [averageSalary, setAverageSalary] = useState(150000);

  const { data: simulation } = trpc.merchantSocial.simulatePension.useQuery(
    { age, yearsContributed, averageSalary },
    { enabled: age > 0 && averageSalary > 0 }
  );

  // Calculer le countdown jusqu'à l'expiration
  const daysUntilExpiry = cnpsInfo?.cnpsExpiryDate
    ? Math.ceil((new Date(cnpsInfo.cnpsExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">CNPS - Retraite</h1>
        </div>
        <p className="text-gray-600">Caisse Nationale de Prévoyance Sociale</p>
      </div>

      {/* Statut et KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className={cnpsInfo?.cnpsStatus === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${cnpsInfo?.cnpsStatus === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Shield className={`h-6 w-6 ${cnpsInfo?.cnpsStatus === 'active' ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {cnpsInfo?.cnpsStatus === 'active' ? 'Actif' : cnpsInfo?.cnpsStatus === 'pending' ? 'En attente' : 'Inactif'}
                </p>
                <p className="text-sm text-gray-600">Statut CNPS</p>
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
                  {cnpsInfo?.balance ? `${Math.round(cnpsInfo.balance).toLocaleString()} FCFA` : '0 FCFA'}
                </p>
                <p className="text-sm text-gray-600">Solde cotisations</p>
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
                <p className="text-2xl font-bold text-gray-900">{cnpsInfo?.cnpsNumber || 'N/A'}</p>
                <p className="text-sm text-gray-600">Numéro CNPS</p>
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
                <p className="font-semibold text-orange-900">Votre couverture CNPS expire bientôt !</p>
                <p className="text-sm text-orange-700">
                  Il vous reste {daysUntilExpiry} jours. Pensez à renouveler votre cotisation.
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
            <CardTitle>Évolution des cotisations</CardTitle>
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
                  <Line type="monotone" dataKey="totalAmount" stroke="#3b82f6" name="Montant (FCFA)" />
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

        {/* Simulateur de pension */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Simulateur de pension
            </CardTitle>
            <CardDescription>Estimez votre pension de retraite</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="age">Âge actuel</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  min={18}
                  max={100}
                />
              </div>

              <div>
                <Label htmlFor="years">Années de cotisation</Label>
                <Input
                  id="years"
                  type="number"
                  value={yearsContributed}
                  onChange={(e) => setYearsContributed(Number(e.target.value))}
                  min={0}
                  max={50}
                />
              </div>

              <div>
                <Label htmlFor="salary">Salaire moyen mensuel (FCFA)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={averageSalary}
                  onChange={(e) => setAverageSalary(Number(e.target.value))}
                  min={0}
                  step={10000}
                />
              </div>

              {simulation && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Résultats de la simulation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Pension mensuelle estimée :</span>
                      <span className="font-bold text-blue-900">{simulation.monthlyPension.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Taux de remplacement :</span>
                      <span className="font-semibold text-blue-900">{simulation.replacementRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Années avant la retraite :</span>
                      <span className="font-semibold text-blue-900">{simulation.yearsUntilRetirement} ans</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Cotisation mensuelle :</span>
                      <span className="font-semibold text-blue-900">{simulation.monthlyContribution.toLocaleString()} FCFA</span>
                    </div>
                    {simulation.eligibleForRetirement && (
                      <div className="mt-3 p-2 bg-green-100 rounded text-green-900 font-semibold text-center">
                        ✅ Vous êtes éligible à la retraite !
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des cotisations</CardTitle>
          <CardDescription>10 derniers paiements</CardDescription>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="font-semibold">{Math.round(Number(payment.amount)).toLocaleString()} FCFA</TableCell>
                    <TableCell className="capitalize">{payment.paymentMethod.replace('_', ' ')}</TableCell>
                    <TableCell className="text-sm text-gray-600">{payment.reference}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status === 'completed' ? 'Payé' : payment.status === 'pending' ? 'En attente' : 'Échoué'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun paiement enregistré</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
