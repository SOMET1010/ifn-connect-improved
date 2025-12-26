import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users } from 'lucide-react';

interface EnrollmentTrendChartProps {
  data: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * Graphique de tendance des enrôlements sur 12 mois
 * Affiche le nombre de marchands enrôlés par mois
 */
export default function EnrollmentTrendChart({ data }: EnrollmentTrendChartProps) {
  // Formater les données pour l'affichage
  const formattedData = data.map(item => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  // Calculer la tendance (croissance moyenne)
  const totalEnrollments = data.reduce((sum, item) => sum + item.count, 0);
  const avgPerMonth = data.length > 0 ? Math.round(totalEnrollments / data.length) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Tendance des Enrôlements
        </CardTitle>
        <CardDescription>
          Nombre de marchands enrôlés sur les 12 derniers mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              Total enrôlés
            </div>
            <div className="text-2xl font-bold text-primary">{totalEnrollments}</div>
          </div>
          <div className="p-4 bg-secondary/10 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Moyenne/mois</div>
            <div className="text-2xl font-bold">{avgPerMonth}</div>
          </div>
        </div>

        {/* Graphique */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="monthLabel" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Enrôlements"
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Note */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Les données sont basées sur la date de création des comptes marchands
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
