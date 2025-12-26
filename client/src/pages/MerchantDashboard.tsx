import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  Wallet, 
  AlertTriangle, 
  ShoppingCart, 
  Package, 
  DollarSign,
  HelpCircle 
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { WeatherWidget } from '@/components/WeatherWidget';

export default function MerchantDashboard() {
  const { user, merchant, isLoading: authLoading } = useAuth();
  
  // Si pas de marchand lié, afficher un message
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }
  
  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accès Refusé</CardTitle>
            <CardDescription>Vous devez être enregistré comme marchand pour accéder à cette page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  const merchantId = merchant.id;
  
  // Message de bienvenue personnalisé
  const welcomeMessage = `Bienvenue, ${merchant.businessName || user?.name || 'Marchand'} !`;
  const merchantCode = merchant.merchantNumber;

  // Récupérer toutes les données du dashboard
  const { data: todayStats, isLoading: loadingToday } = trpc.sales.todayStats.useQuery({ merchantId });
  const { data: totalBalance, isLoading: loadingBalance } = trpc.sales.totalBalance.useQuery({ merchantId });
  const { data: lowStockCount, isLoading: loadingStock } = trpc.sales.lowStockCount.useQuery({ merchantId });
  const { data: last7Days, isLoading: loadingChart } = trpc.sales.last7Days.useQuery({ merchantId });
  const { data: topProducts, isLoading: loadingTop } = trpc.sales.topProducts.useQuery({ merchantId });

  const isLoading = loadingToday || loadingBalance || loadingStock || loadingChart || loadingTop;

  // Formater les données pour le graphique
  const chartData = last7Days?.map(item => {
    // Parser la date au format YYYY-MM-DD
    const [year, month, day] = item.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    return {
      date: dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      montant: item.totalAmount,
      ventes: item.salesCount,
    };
  }) || [];
  
  // Debug: afficher les données dans la console
  if (last7Days && last7Days.length > 0) {
    console.log('📊 Données brutes last7Days:', last7Days);
    console.log('📊 Données formatées chartData:', chartData);
  }

  // Formater les données pour le top produits
  const topProductsData = topProducts?.map(item => ({
    name: item.productName.length > 15 ? item.productName.substring(0, 15) + '...' : item.productName,
    quantite: item.totalQuantity,
    montant: item.totalAmount,
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header avec message de bienvenue */}
      <div className="bg-white border-b border-orange-200 shadow-sm">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{welcomeMessage}</h1>
              <p className="text-gray-600 mt-1">
                Code marchand : <span className="font-semibold text-orange-600">{merchantCode}</span>
                {' '}• Vue d'ensemble de votre activité
              </p>
            </div>
            {user?.role && (
              <div className="hidden md:block px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                {user.role === 'merchant' ? '👨‍💼 Marchand' : user.role === 'agent' ? '👨‍💻 Agent' : '👑 Admin'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-8">
        {/* Widget Météo */}
        <div className="mb-6">
          <WeatherWidget enabled={true} />
        </div>

        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ventes du jour */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="border-orange-200 hover:shadow-lg transition-shadow cursor-help">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Ventes du Jour</CardTitle>
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  {loadingToday ? (
                    <div className="h-8 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-gray-900">
                        {(todayStats?.totalAmount || 0).toLocaleString('fr-FR')} FCFA
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {todayStats?.salesCount || 0} vente{(todayStats?.salesCount || 0) > 1 ? 's' : ''}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-orange-600 text-white font-semibold">
              💰 Djê du Jour
            </TooltipContent>
          </Tooltip>

          {/* Solde Total */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="border-green-200 hover:shadow-lg transition-shadow cursor-help">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Solde Total</CardTitle>
                  <Wallet className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  {loadingBalance ? (
                    <div className="h-8 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-gray-900">
                        {(totalBalance || 0).toLocaleString('fr-FR')} FCFA
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Toutes ventes confondues</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-green-600 text-white font-semibold">
              👛 Mon Bédou Total
            </TooltipContent>
          </Tooltip>

          {/* Alertes Stock */}
          <Card className="border-red-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Alertes Stock</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              {loadingStock ? (
                <div className="h-8 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-900">{lowStockCount || 0}</div>
                  <p className="text-sm text-gray-600 mt-1">Produit{(lowStockCount || 0) > 1 ? 's' : ''} en rupture</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Couverture Sociale */}
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Couverture Sociale</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">CNPS</span>
                  <span className="text-sm font-semibold text-orange-600">En attente</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">CMU</span>
                  <span className="text-sm font-semibold text-orange-600">En attente</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerte Stock Bas */}
        {(lowStockCount || 0) > 0 && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Attention !</strong> Vous avez {lowStockCount} produit{(lowStockCount || 0) > 1 ? 's' : ''} en stock bas. 
              Pensez à réapprovisionner rapidement.
            </AlertDescription>
          </Alert>
        )}

        {/* Graphiques Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique Ventes 7 Jours */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Ventes des 7 Derniers Jours
              </CardTitle>
              <CardDescription>Évolution de votre chiffre d'affaires</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingChart ? (
                <div className="h-64 bg-gray-200 animate-pulse rounded" />
              ) : chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Aucune vente enregistrée
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Montant']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="montant" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      dot={{ fill: '#f97316', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top 5 Produits */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Top 5 Produits Vendus
              </CardTitle>
              <CardDescription>Vos meilleures ventes</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTop ? (
                <div className="h-64 bg-gray-200 animate-pulse rounded" />
              ) : topProductsData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Aucune vente enregistrée
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      type="number" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      width={100}
                    />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [
                        name === 'quantite' ? `${value} unités` : `${value.toLocaleString('fr-FR')} FCFA`,
                        name === 'quantite' ? 'Quantité' : 'Montant'
                      ]}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Bar dataKey="quantite" fill="#22c55e" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Rapides */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="lg" 
                    className="h-24 flex flex-col gap-2 bg-orange-600 hover:bg-orange-700"
                    onClick={() => window.location.href = '/merchant/sell'}
                  >
                    <ShoppingCart className="h-8 w-8" />
                    <span>Vendre</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-orange-600 text-white font-semibold">
                  🛒 Faire mon Djossi
                </TooltipContent>
              </Tooltip>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="h-24 flex flex-col gap-2 border-green-600 text-green-700 hover:bg-green-50"
                onClick={() => window.location.href = '/merchant/stock'}
              >
                <Package className="h-8 w-8" />
                <span>Stock</span>
              </Button>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                    onClick={() => window.location.href = '/merchant/money'}
                  >
                    <DollarSign className="h-8 w-8" />
                    <span>Argent</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-blue-600 text-white font-semibold">
                  💸 Fata / Enjailler
                </TooltipContent>
              </Tooltip>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="h-24 flex flex-col gap-2 border-gray-600 text-gray-700 hover:bg-gray-50"
                onClick={() => window.location.href = '/merchant/help'}
              >
                <HelpCircle className="h-8 w-8" />
                <span>Aide</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Mobile Fixe */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button 
            variant="ghost" 
            className="flex flex-col gap-1 h-16"
            onClick={() => window.location.href = '/merchant/sell'}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs">Vendre</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col gap-1 h-16"
            onClick={() => window.location.href = '/merchant/stock'}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Stock</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col gap-1 h-16"
            onClick={() => window.location.href = '/merchant/money'}
          >
            <DollarSign className="h-5 w-5" />
            <span className="text-xs">Argent</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col gap-1 h-16"
            onClick={() => window.location.href = '/merchant/help'}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs">Aide</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
