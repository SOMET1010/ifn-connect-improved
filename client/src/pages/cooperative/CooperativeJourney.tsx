import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  Warehouse, 
  TrendingUp, 
  Shield, 
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Lock,
  Zap,
  Globe,
  Users
} from 'lucide-react';
import { Link } from 'wouter';

/**
 * Page Parcours Coopérative
 * Visualisation des 5 axes stratégiques de digitalisation
 */
export default function CooperativeJourney() {
  const axes = [
    {
      id: 1,
      title: 'Approvisionnement & Paiements',
      icon: ShoppingBag,
      color: 'from-blue-500 to-cyan-600',
      description: 'Simplifiez la consolidation des besoins et fluidifiez les paiements',
      features: [
        'Application marchands pour expression des besoins',
        'Marché virtuel pour relation directe producteurs ↔ coopératives',
        'Paiements mobiles sécurisés',
        'Tableau de suivi coopératif en temps réel',
      ],
      benefits: 'Réduction de 40% du temps de traitement des commandes',
    },
    {
      id: 2,
      title: 'Stockage Intelligent',
      icon: Warehouse,
      color: 'from-green-500 to-emerald-600',
      description: 'Optimisez la gestion de vos stocks avec des alertes automatiques',
      features: [
        'Suivi digitalisé du stock en temps réel',
        'Notifications automatiques sur niveaux critiques',
        'Optimisation des coûts de conservation',
        'Réduction des pertes et gaspillages',
      ],
      benefits: 'Réduction de 30% des pertes de stock',
    },
    {
      id: 3,
      title: 'Vente & Reporting',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-600',
      description: 'Automatisez vos ventes et générez des bilans financiers instantanés',
      features: [
        'Application coopérative pour enregistrement des ventes',
        'Outil de versements tracés',
        'Bilan financier automatisé',
        'Calcul des bénéfices en temps réel',
      ],
      benefits: '100% de traçabilité financière',
    },
    {
      id: 4,
      title: 'Protection Sociale Intégrée',
      icon: Shield,
      color: 'from-orange-500 to-red-600',
      description: 'Facilitez l\'accès à la protection sociale pour tous vos membres',
      features: [
        'Plateforme unique pour paiement CNPS et CNAM',
        'Intégration directe dans le système coopératif',
        'Inclusion sociale pour chaque membre',
        'Assurance santé accessible',
      ],
      benefits: '+50% de satisfaction des membres',
    },
    {
      id: 5,
      title: 'Renforcement des Capacités',
      icon: GraduationCap,
      color: 'from-indigo-500 to-purple-600',
      description: 'Formez vos membres en continu avec des outils modernes',
      features: [
        'Modules e-learning accessibles sur mobile',
        'Tutoriels vidéo pratiques',
        'Notifications et suivi de participation',
        'Mesure de l\'impact des formations',
      ],
      benefits: 'Montée en compétences mesurable',
    },
  ];

  const kpis = [
    {
      icon: Zap,
      value: '+40%',
      label: 'Efficacité Opérationnelle',
      description: 'Grâce à l\'automatisation des processus',
    },
    {
      icon: Lock,
      value: '100%',
      label: 'Traçabilité Financière',
      description: 'Chaque transaction est vérifiable et sécurisée',
    },
    {
      icon: BarChart3,
      value: '-30%',
      label: 'Réduction des Pertes',
      description: 'Stocks, ventes et paiements optimisés',
    },
    {
      icon: Users,
      value: '+50%',
      label: 'Satisfaction Membres',
      description: 'Gestion moderne et transparente',
    },
    {
      icon: Globe,
      value: '🏆',
      label: 'Modèle National',
      description: 'Innovation et gouvernance exemplaire',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            🌍 Parcours Coopérative 100% Digital
          </h1>
          <p className="text-2xl md:text-3xl mb-8 max-w-4xl mx-auto">
            Transformez votre coopérative en pôle de performance économique
          </p>
          <div className="flex items-center justify-center gap-4 text-xl">
            <TrendingUp className="w-8 h-8" />
            <span className="font-semibold">Traçabilité • Transparence • Modernisation</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        
        {/* Vision */}
        <Card className="p-12 mb-20 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-6">
            🎯 Notre Vision
          </h2>
          <p className="text-xl text-gray-700 text-center max-w-4xl mx-auto leading-relaxed">
            La digitalisation du parcours coopérative n'est pas seulement une modernisation technique. 
            C'est une <strong>révolution opérationnelle et sociale</strong> qui vise à transformer nos coopératives 
            en pôles de performance économique, garantir une traçabilité complète des flux financiers et logistiques, 
            et assurer une inclusion sociale et financière durable pour tous les membres.
          </p>
        </Card>

        {/* Les 5 Axes Stratégiques */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Les 5 Axes Stratégiques de Transformation
          </h2>
          
          <div className="space-y-8">
            {axes.map((axe, index) => {
              const Icon = axe.icon;
              return (
                <Card key={axe.id} className="overflow-hidden hover:shadow-2xl transition-shadow">
                  <div className="flex flex-col lg:flex-row">
                    {/* Numéro et Icône */}
                    <div className={`bg-gradient-to-br ${axe.color} text-white p-8 lg:w-80 flex flex-col items-center justify-center`}>
                      <div className="text-6xl font-bold mb-4">
                        {axe.id}
                      </div>
                      <Icon className="w-20 h-20 mb-4" />
                      <h3 className="text-2xl font-bold text-center mb-4">
                        {axe.title}
                      </h3>
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-sm font-semibold">{axe.benefits}</span>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 p-8">
                      <p className="text-xl text-gray-700 mb-6">
                        {axe.description}
                      </p>

                      {/* Features */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {axe.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Flèche de progression */}
                  {index < axes.length - 1 && (
                    <div className="flex justify-center py-4 bg-gray-50">
                      <ArrowRight className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* KPIs Attendus */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            📊 Résultats Attendus
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-xl transition-shadow text-center">
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {kpi.value}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {kpi.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {kpi.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Problématique Actuelle */}
        <Card className="p-12 mb-20 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            🚩 Problématique Actuelle
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-red-500 font-bold">❌</span>
              <span>Processus fragmentés et manuels (cahiers papier, téléphone, déplacements)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-red-500 font-bold">❌</span>
              <span>Traçabilité faible des stocks et transactions</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-red-500 font-bold">❌</span>
              <span>Perte de temps et d'argent liée à la gestion artisanale</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-red-500 font-bold">❌</span>
              <span>Faible sécurisation des flux financiers</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-red-500 font-bold">❌</span>
              <span>Accès limité à la protection sociale et à la formation</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-red-500 font-bold">❌</span>
              <span>Perte de compétitivité et gouvernance affaiblie</span>
            </div>
          </div>
        </Card>

        {/* CTA Final */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Prêt à Moderniser Votre Coopérative ?
          </h2>
          <p className="text-2xl mb-8 max-w-3xl mx-auto">
            Inscrivez votre coopérative dans la trajectoire de la modernisation et de la compétitivité durable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cooperative">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Accéder au Dashboard
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100">
              Demander une Démo
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
