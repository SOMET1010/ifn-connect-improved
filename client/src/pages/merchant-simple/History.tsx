import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, History as HistoryIcon, Calendar, TrendingUp, ShoppingBag, Filter, ChevronDown } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { trpc } from '@/lib/trpc';
import { format, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

export default function MerchantHistory() {
  const [, setLocation] = useLocation();
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: sales = [] } = trpc.sales.list.useQuery();

  const filteredSales = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterPeriod) {
      case 'today':
        return sales.filter(s => {
          const saleDate = new Date(s.createdAt);
          return saleDate >= today;
        });
      case 'week':
        const weekStart = startOfWeek(now, { locale: fr });
        return sales.filter(s => {
          const saleDate = new Date(s.createdAt);
          return isWithinInterval(saleDate, { start: weekStart, end: now });
        });
      case 'month':
        const monthStart = startOfMonth(now);
        return sales.filter(s => {
          const saleDate = new Date(s.createdAt);
          return isWithinInterval(saleDate, { start: monthStart, end: now });
        });
      default:
        return sales;
    }
  }, [sales, filterPeriod]);

  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalItems = filteredSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const avgSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    return { totalRevenue, totalItems, avgSale, count: filteredSales.length };
  }, [filteredSales]);

  const groupedSales = useMemo(() => {
    const groups: { [key: string]: typeof sales } = {};

    filteredSales.forEach(sale => {
      const date = format(new Date(sale.createdAt), 'dd MMMM yyyy', { locale: fr });
      if (!groups[date]) groups[date] = [];
      groups[date].push(sale);
    });

    return Object.entries(groups).sort((a, b) =>
      new Date(b[1][0].createdAt).getTime() - new Date(a[1][0].createdAt).getTime()
    );
  }, [filteredSales]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.15),transparent_50%)]" />

      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/merchant')}
        className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 p-3 rounded-2xl shadow-lg transition-all hover:scale-105"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 animate-[slideDown_0.5s_ease-out]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <HistoryIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              Historique
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-[slideUp_0.6s_ease-out]">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-lg text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Revenus Total</p>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} F</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 shadow-lg text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Ventes Total</p>
              <ShoppingBag className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.count}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-lg text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Vente Moyenne</p>
              <Calendar className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.avgSale.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg mb-6 animate-[slideUp_0.7s_ease-out]">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between text-lg font-bold text-gray-900"
          >
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <span>Filtrer par période</span>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                { value: 'all', label: 'Tout' },
                { value: 'today', label: "Aujourd'hui" },
                { value: 'week', label: 'Cette semaine' },
                { value: 'month', label: 'Ce mois' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterPeriod(filter.value as FilterPeriod)}
                  className={`py-3 px-4 rounded-xl font-bold transition-all ${
                    filterPeriod === filter.value
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {groupedSales.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <HistoryIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune vente</h2>
            <p className="text-lg text-gray-600">
              {filterPeriod === 'all'
                ? "Tu n'as pas encore enregistré de ventes"
                : "Aucune vente pour cette période"}
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-[slideUp_0.8s_ease-out]">
            {groupedSales.map(([date, dateSales], groupIndex) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900 capitalize">{date}</h2>
                  <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {dateSales.length} {dateSales.length > 1 ? 'ventes' : 'vente'}
                  </span>
                </div>

                <div className="grid gap-3">
                  {dateSales.map((sale, saleIndex) => (
                    <div
                      key={sale.id}
                      className="bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-all"
                      style={{
                        animation: `slideUp 0.6s ease-out ${(groupIndex * 0.1) + (saleIndex * 0.05)}s backwards`
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{sale.productName}</h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(sale.createdAt), 'HH:mm', { locale: fr })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {sale.totalAmount?.toLocaleString()} F
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-bold">
                            Qté: {sale.quantity}
                          </div>
                          <div className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-bold">
                            {sale.unitPrice?.toLocaleString()} F/unité
                          </div>
                        </div>
                        {sale.paymentMethod && (
                          <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold capitalize">
                            {sale.paymentMethod}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
