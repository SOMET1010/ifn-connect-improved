import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';

interface TransactionTrendChartProps {
  data: Array<{
    month: string;
    count: number;
    volume: number;
  }>;
}

/**
 * Graphique de tendance des transactions sur 12 mois
 * Affiche le volume (FCFA) et le nombre de transactions par mois
 */
export default function TransactionTrendChart({ data }: TransactionTrendChartProps) {
  // Formater les données pour l'affichage
  const formattedData = data.map(item => ({
    ...item,
    monthLabel: formatMonth(item.month),
    volumeInK: Math.round(item.volume / 1000), // Convertir en milliers de FCFA
  }));

  // Calculer les statistiques
  const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const avgTicket = totalCount > 0 ? Math.round(totalVolume / totalCount) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Tendance des Transactions
        </CardTitle>
        <CardDescription>
          Volume et nombre de transactions sur les 12 derniers mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              Volume total
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalVolume)}
            </div>
          </div>
          <div className="p-4 bg-secondary/10 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ShoppingCart className="w-4 h-4" />
              Transactions
            </div>
            <div className="text-2xl font-bold">{totalCount.toLocaleString('fr-FR')}</div>
          </div>
          <div className="p-4 bg-accent/10 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Ticket moyen</div>
            <div className="text-2xl font-bold">{avgTicket.toLocaleString('fr-FR')} F</div>
          </div>
        </div>

        {/* Graphique combiné */}
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="monthLabel" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: 'Volume (k FCFA)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: 'Nombre', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: any, name: string) => {
                if (name === 'Volume (k FCFA)') {
                  return [`${value.toLocaleString('fr-FR')} k FCFA`, name];
                }
                return [value.toLocaleString('fr-FR'), name];
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="volumeInK" 
              fill="hsl(var(--primary))" 
              name="Volume (k FCFA)"
              radius={[4, 4, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Nombre de transactions"
              dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Note */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Le volume est affiché en milliers de FCFA pour une meilleure lisibilité
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Formater le mois au format "Jan 2025"
 */
function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
}

/**
 * Formater le montant en FCFA
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M F`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k F`;
  }
  return `${amount} F`;
}
