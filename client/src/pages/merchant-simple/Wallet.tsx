import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Send, Users, Plus, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function Wallet() {
  const [, setLocation] = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: wallet, isLoading: walletLoading } = trpc.wallet.getBalance.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: transactions, isLoading: transactionsLoading } = trpc.wallet.getTransactions.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 }
  );

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer_sent':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'transfer_received':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'deposit':
        return <Plus className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Complété', variant: 'default' as const },
      pending: { label: 'En attente', variant: 'secondary' as const },
      failed: { label: 'Échoué', variant: 'destructive' as const },
      cancelled: { label: 'Annulé', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/merchant/dashboard')}
        className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-100 text-gray-700 p-4 rounded-full shadow-lg transition-all"
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Mon Wallet</h1>
          <p className="text-xl text-gray-600">Gérer votre argent facilement</p>
        </div>

        {walletLoading ? (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Solde disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold mb-6">
                {formatAmount(wallet?.balance || 0)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setLocation('/merchant/send-money')}
                  className="bg-white text-blue-600 hover:bg-gray-100 h-16 text-lg font-semibold"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer
                </Button>
                <Button
                  onClick={() => setLocation('/merchant/beneficiaries')}
                  variant="outline"
                  className="bg-white/10 text-white border-white hover:bg-white/20 h-16 text-lg font-semibold"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Contacts
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-gray-100 rounded-full">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {transaction.description || 'Transaction'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Réf: {transaction.reference}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          transaction.type === 'transfer_received' || transaction.type === 'deposit'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'transfer_received' || transaction.type === 'deposit'
                          ? '+'
                          : '-'}
                        {formatAmount(transaction.amount)}
                      </div>
                      <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Aucune transaction pour le moment</p>
                <Button
                  onClick={() => setLocation('/merchant/send-money')}
                  className="mt-4"
                  variant="outline"
                >
                  Effectuer une transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
