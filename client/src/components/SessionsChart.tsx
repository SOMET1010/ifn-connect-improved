import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SessionsChartProps {
  data: Array<{
    date: Date;
    hoursWorked: number;
  }>;
  title?: string;
  description?: string;
}

/**
 * Composant de graphique pour visualiser l'évolution des heures travaillées
 */
export default function SessionsChart({ data, title, description }: SessionsChartProps) {
  // Préparer les données pour Recharts
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    heures: item.hoursWorked,
  }));

  // Prendre uniquement les 7 derniers jours
  const last7Days = chartData.slice(-7);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Heures travaillées (7 derniers jours)'}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Heures', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              formatter={(value: number) => [`${value}h`, 'Heures travaillées']}
            />
            <Line 
              type="monotone" 
              dataKey="heures" 
              stroke="#f97316" 
              strokeWidth={3}
              dot={{ fill: '#f97316', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ComparisonCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  currentLabel: string;
  previousLabel: string;
  unit?: string;
}

/**
 * Carte de comparaison avec indicateur de tendance
 */
export function ComparisonCard({
  title,
  currentValue,
  previousValue,
  currentLabel,
  previousLabel,
  unit = 'h',
}: ComparisonCardProps) {
  const difference = currentValue - previousValue;
  const percentageChange = previousValue > 0 
    ? Math.round((difference / previousValue) * 100) 
    : 0;

  const getTrendIcon = () => {
    if (difference > 0) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (difference < 0) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (difference > 0) return 'text-green-600';
    if (difference < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const getTrendBgColor = () => {
    if (difference > 0) return 'bg-green-50';
    if (difference < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Valeur actuelle */}
          <div>
            <p className="text-sm text-gray-500">{currentLabel}</p>
            <p className="text-3xl font-bold text-gray-900">{currentValue}{unit}</p>
          </div>

          {/* Comparaison */}
          <div className={`flex items-center gap-2 p-3 rounded-lg ${getTrendBgColor()}`}>
            {getTrendIcon()}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${getTrendColor()}`}>
                {difference > 0 ? '+' : ''}{difference.toFixed(1)}{unit} ({percentageChange > 0 ? '+' : ''}{percentageChange}%)
              </p>
              <p className="text-xs text-gray-600">vs {previousLabel} ({previousValue}{unit})</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
