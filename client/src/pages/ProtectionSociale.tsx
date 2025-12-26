import { useEffect } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Calendar,
  DollarSign,
  Activity,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ProtectionSociale() {
  const { data: status, isLoading: statusLoading } = trpc.protectionSociale.getStatus.useQuery();
  const { data: stats } = trpc.protectionSociale.getStatistics.useQuery({ period: '1year' });
  const { data: history } = trpc.protectionSociale.getPaymentHistory.useQuery({
    limit: 10,
    offset: 0,
    type: 'all',
  });

  useEffect(() => {
    document.title = 'Protection Sociale | IFN Connect';
  }, []);

  if (statusLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Déterminer les étapes du parcours utilisateur
  const getJourneySteps = () => {
    const steps = [];

    // Étape 1: Inscription CNPS
    if (!status?.cnps.number) {
      steps.push({
        id: 'cnps-register',
        title: 'Inscrivez-vous à la CNPS',
        description: 'Obtenez votre numéro de sécurité sociale',
        status: 'current' as const,
        icon: Shield,
        action: '/merchant/cnps',
        actionLabel: 'Commencer',
      });
    } else if (status.cnps.criticalityLevel === 'expired' || status.cnps.criticalityLevel === 'critical') {
      steps.push({
        id: 'cnps-renew',
        title: 'Renouvelez votre CNPS',
        description: status.cnps.criticalityLevel === 'expired' ? 'Votre cotisation a expiré' : `Expire dans ${status.cnps.daysRemaining} jours`,
        status: 'current' as const,
        icon: Shield,
        action: '/merchant/cnps',
        actionLabel: 'Renouveler maintenant',
        urgent: true,
      });
    } else if (status.cnps.status === 'active') {
      steps.push({
        id: 'cnps-active',
        title: 'CNPS Active',
        description: `Valide jusqu'au ${status.cnps.expiryDate ? new Date(status.cnps.expiryDate).toLocaleDateString('fr-FR') : 'N/A'}`,
        status: 'completed' as const,
        icon: CheckCircle2,
      });
    }

    // Étape 2: Inscription CMU
    if (!status?.cmu.number) {
      steps.push({
        id: 'cmu-register',
        title: 'Inscrivez-vous à la CMU',
        description: 'Bénéficiez de la couverture santé universelle',
        status: steps.length === 0 ? ('current' as const) : ('upcoming' as const),
        icon: Heart,
        action: '/merchant/cmu',
        actionLabel: 'Commencer',
      });
    } else if (status.cmu.criticalityLevel === 'expired' || status.cmu.criticalityLevel === 'critical') {
      steps.push({
        id: 'cmu-renew',
        title: 'Renouvelez votre CMU',
        description: status.cmu.criticalityLevel === 'expired' ? 'Votre couverture a expiré' : `Expire dans ${status.cmu.daysRemaining} jours`,
        status: steps.length === 0 ? ('current' as const) : ('upcoming' as const),
        icon: Heart,
        action: '/merchant/cmu',
        actionLabel: 'Renouveler maintenant',
        urgent: true,
      });
    } else if (status.cmu.status === 'active') {
      steps.push({
        id: 'cmu-active',
        title: 'CMU Active',
        description: `Valide jusqu'au ${status.cmu.expiryDate ? new Date(status.cmu.expiryDate).toLocaleDateString('fr-FR') : 'N/A'}`,
        status: 'completed' as const,
        icon: CheckCircle2,
      });
    }

    // Étape 3: Maintenir les cotisations
    if (status?.cnps.status === 'active' && status?.cmu.status === 'active') {
      steps.push({
        id: 'maintain',
        title: 'Maintenez vos protections',
        description: 'Continuez à cotiser régulièrement',
        status: 'current' as const,
        icon: Activity,
      });
    }

    return steps;
  };

  const journeySteps = getJourneySteps();
  const currentStep = journeySteps.find((s) => s.status === 'current');

  // Fonction pour obtenir la couleur de badge selon la criticité
  const getCriticalityColor = (level: string) => {
    switch (level) {
      case 'expired':
        return 'destructive';
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'good':
        return 'default';
      default:
        return 'secondary';
    }
  };

  // Fonction pour obtenir l'icône selon la criticité
  const getCriticalityIcon = (level: string) => {
    switch (level) {
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container py-8 space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Protection Sociale</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre CNPS et votre CMU en un seul endroit
        </p>
      </div>

      {/* Fil d'Ariane Dynamique - Guidage Utilisateur */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Votre Parcours de Protection Sociale
          </CardTitle>
          <CardDescription>
            Suivez ces étapes pour bénéficier d'une protection complète
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === journeySteps.length - 1;

              return (
                <div key={step.id}>
                  <div className="flex items-start gap-4">
                    {/* Icône de statut */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        step.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : step.status === 'current'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`font-semibold ${
                            step.status === 'current' ? 'text-primary' : ''
                          }`}
                        >
                          {step.title}
                        </h3>
                        {step.urgent && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                        {step.status === 'completed' && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            ✓ Complété
                          </Badge>
                        )}
                        {step.status === 'current' && (
                          <Badge variant="default" className="text-xs">
                            En cours
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                      {step.action && step.status === 'current' && (
                        <Link href={step.action}>
                          <Button size="sm" className="mt-3" variant={step.urgent ? 'destructive' : 'default'}>
                            {step.actionLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Ligne de connexion */}
                  {!isLast && (
                    <div className="ml-5 h-8 w-0.5 bg-border"></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alertes d'expiration */}
      {(status?.cnps.criticalityLevel === 'critical' ||
        status?.cnps.criticalityLevel === 'expired' ||
        status?.cmu.criticalityLevel === 'critical' ||
        status?.cmu.criticalityLevel === 'expired') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action requise</AlertTitle>
          <AlertDescription>
            {status.cnps.criticalityLevel === 'expired' && (
              <div>Votre cotisation CNPS a expiré. Renouvelez-la dès maintenant.</div>
            )}
            {status.cnps.criticalityLevel === 'critical' && (
              <div>
                Votre cotisation CNPS expire dans {status.cnps.daysRemaining} jours.
              </div>
            )}
            {status.cmu.criticalityLevel === 'expired' && (
              <div>Votre couverture CMU a expiré. Renouvelez-la dès maintenant.</div>
            )}
            {status.cmu.criticalityLevel === 'critical' && (
              <div>
                Votre couverture CMU expire dans {status.cmu.daysRemaining} jours.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Cartes de statut CNPS et CMU */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* CNPS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              CNPS - Retraite
            </CardTitle>
            <CardDescription>Caisse Nationale de Prévoyance Sociale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Statut</span>
              <Badge variant={getCriticalityColor(status?.cnps.criticalityLevel || 'none')}>
                {status?.cnps.status === 'active' ? 'Active' : status?.cnps.status === 'inactive' ? 'Inactive' : 'En attente'}
              </Badge>
            </div>

            {status?.cnps.number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Numéro</span>
                <span className="font-mono text-sm">{status.cnps.number}</span>
              </div>
            )}

            {status?.cnps.expiryDate && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expiration</span>
                  <div className="flex items-center gap-2">
                    {getCriticalityIcon(status.cnps.criticalityLevel)}
                    <span className="text-sm">
                      {new Date(status.cnps.expiryDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {status.cnps.daysRemaining !== null && status.cnps.daysRemaining > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Jours restants</span>
                    <span className="text-sm font-semibold">{status.cnps.daysRemaining} jours</span>
                  </div>
                )}
              </>
            )}

            <Separator />

            <Link href="/merchant/cnps">
              <Button className="w-full" variant="outline">
                {status?.cnps.number ? 'Gérer ma CNPS' : 'M\'inscrire à la CNPS'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* CMU */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              CMU - Santé
            </CardTitle>
            <CardDescription>Couverture Maladie Universelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Statut</span>
              <Badge variant={getCriticalityColor(status?.cmu.criticalityLevel || 'none')}>
                {status?.cmu.status === 'active' ? 'Active' : status?.cmu.status === 'inactive' ? 'Inactive' : 'En attente'}
              </Badge>
            </div>

            {status?.cmu.number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Numéro</span>
                <span className="font-mono text-sm">{status.cmu.number}</span>
              </div>
            )}

            {status?.cmu.expiryDate && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expiration</span>
                  <div className="flex items-center gap-2">
                    {getCriticalityIcon(status.cmu.criticalityLevel)}
                    <span className="text-sm">
                      {new Date(status.cmu.expiryDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {status.cmu.daysRemaining !== null && status.cmu.daysRemaining > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Jours restants</span>
                    <span className="text-sm font-semibold">{status.cmu.daysRemaining} jours</span>
                  </div>
                )}
              </>
            )}

            <Separator />

            <Link href="/merchant/cmu">
              <Button className="w-full" variant="outline">
                {status?.cmu.number ? 'Gérer ma CMU' : 'M\'inscrire à la CMU'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total CNPS</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.cnps.totalAmount.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.cnps.totalTransactions} transaction(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total CMU</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.cmu.totalAmount.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.cmu.totalTransactions} transaction(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.cnps.successRate.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">Paiements CNPS réussis</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphique des tendances */}
      {stats && stats.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendances des paiements</CardTitle>
            <CardDescription>Évolution de vos cotisations sur 12 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  name="Montant (FCFA)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Historique des transactions */}
      {history && history.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
            <CardDescription>Vos derniers paiements CNPS et CMU</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.transactions.map((transaction) => (
                <div
                  key={`${transaction.type}-${transaction.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {transaction.type === 'cnps' ? (
                      <Shield className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Heart className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {transaction.type === 'cnps' ? 'CNPS' : 'CMU'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {parseFloat(transaction.amount).toLocaleString('fr-FR')} FCFA
                    </p>
                    <Badge
                      variant={
                        transaction.status === 'completed' || transaction.status === 'approved'
                          ? 'default'
                          : transaction.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className="text-xs"
                    >
                      {transaction.status === 'completed'
                        ? 'Complété'
                        : transaction.status === 'approved'
                        ? 'Approuvé'
                        : transaction.status === 'pending'
                        ? 'En attente'
                        : transaction.status === 'failed'
                        ? 'Échoué'
                        : transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
