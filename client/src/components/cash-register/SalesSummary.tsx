import { Card } from '@/components/ui/card';

interface SalesSummaryProps {
  todaySales?: number;
  todayRevenue?: number;
  isLoading?: boolean;
}

export default function SalesSummary({
  todaySales = 0,
  todayRevenue = 0,
  isLoading = false,
}: SalesSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 animate-pulse bg-gray-200 h-20" />
        <Card className="p-4 animate-pulse bg-gray-200 h-20" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Ventes aujourd'hui</p>
        <p className="text-2xl font-bold text-primary">{todaySales}</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Chiffre d'affaires</p>
        <p className="text-2xl font-bold text-green-600">
          {todayRevenue.toLocaleString('fr-FR')} FCFA
        </p>
      </Card>
    </div>
  );
}
