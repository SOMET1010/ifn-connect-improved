import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EnrollmentTrendsChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export function EnrollmentTrendsChart({ data }: EnrollmentTrendsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Formater les dates (ex: "2024-01-15" → "Lun 15")
    const labels = data.map(item => {
      const date = new Date(item.date);
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const dayName = dayNames[date.getDay()];
      const dayNum = date.getDate();
      return `${dayName} ${dayNum}`;
    });

    const counts = data.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label: 'Enrôlements',
          data: counts,
          borderColor: 'rgb(59, 130, 246)', // Bleu
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4, // Courbe smooth
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `Enrôlements : ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <Card className="border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Tendances d'Enrôlement (7 derniers jours)
          </CardTitle>
          <CardDescription>Aucune donnée disponible</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Aucun enrôlement enregistré</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEnrollments = data.reduce((sum, item) => sum + item.count, 0);
  const avgEnrollments = data.length > 0 ? Math.round(totalEnrollments / data.length) : 0;

  return (
    <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
            </div>
            <div>
              <CardTitle className="text-xl">Tendances d'Enrôlement</CardTitle>
              <CardDescription>7 derniers jours</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Moyenne/jour</p>
            <p className="text-2xl font-bold text-blue-600">{avgEnrollments}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>

        {/* Statistiques résumées */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total 7 jours</p>
            <p className="text-2xl font-bold text-blue-600">{totalEnrollments}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Maximum</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.max(...data.map(d => d.count))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Minimum</p>
            <p className="text-2xl font-bold text-orange-600">
              {Math.min(...data.map(d => d.count))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
