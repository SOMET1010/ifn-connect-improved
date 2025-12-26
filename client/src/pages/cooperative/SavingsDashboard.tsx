import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, DollarSign, ShoppingBag, Award } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export default function SavingsDashboard() {
  // Hardcoded merchantId pour l'exemple (devrait venir de l'auth)
  const merchantId = 1;
  const { data: savingsData, isLoading } = trpc.groupedOrders.getMemberSavings.useQuery({ merchantId });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!savingsData) {
    return (
      <div className="container py-8">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingDown className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord des Économies</h1>
        </div>
        <p className="text-gray-600">
          Suivez vos économies réalisées grâce aux commandes groupées
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Économisé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {savingsData.totalSavings.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Depuis le début de votre participation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Commandes Participées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {savingsData.totalOrders}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Commandes groupées rejointes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Économie Moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">
              {savingsData.averageSavings.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Par commande groupée
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des économies mensuelles */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Économies Mensuelles</CardTitle>
          <CardDescription>
            Évolution de vos économies au fil des mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={savingsData.monthlySavings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top produits économisés */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Produits les Plus Économisés</CardTitle>
          <CardDescription>
            Les produits qui vous ont fait économiser le plus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={savingsData.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="productName" type="category" width={150} />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`}
              />
              <Bar dataKey="savings" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
