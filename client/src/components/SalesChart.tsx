import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { trpc } from '@/lib/trpc';
import { TrendingUp, Loader2 } from 'lucide-react';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesChartProps {
  merchantId: number;
}

export function SalesChart({ merchantId }: SalesChartProps) {
  const { data: salesData, isLoading, error } = trpc.sales.last7Days.useQuery({ merchantId });

  const chartData = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Formater les dates (ex: "2024-01-15" → "Lun 15")
    const labels = salesData.map(item => {
      const date = new Date(item.date);
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const dayName = dayNames[date.getDay()];
      const dayNum = date.getDate();
      return `${dayName} ${dayNum}`;
    });

    const amounts = salesData.map(item => item.totalAmount);

    return {
      labels,
      datasets: [
        {
          label: 'Ventes (FCFA)',
          data: amounts,
          borderColor: 'rgb(234, 122, 95)', // Orange terracotta
          backgroundColor: 'rgba(234, 122, 95, 0.1)',
          fill: true,
          tension: 0.4, // Courbe smooth
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(234, 122, 95)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [salesData]);

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
            return `Ventes : ${value.toLocaleString('fr-FR')} FCFA`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString('fr-FR');
          },
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

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-center h-64 text-red-600">
          <p>Erreur lors du chargement des données</p>
        </div>
      </div>
    );
  }

  const totalSales = salesData?.reduce((sum, item) => sum + item.totalAmount, 0) || 0;
  const avgSales = salesData && salesData.length > 0 ? totalSales / salesData.length : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-orange-600" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Évolution des ventes</h3>
            <p className="text-sm text-gray-500">7 derniers jours</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Moyenne/jour</p>
          <p className="text-xl font-bold text-orange-600">{avgSales.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      {/* Graphique */}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
