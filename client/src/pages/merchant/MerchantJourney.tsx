import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Wallet, 
  Package, 
  Shield, 
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { Link } from 'wouter';

/**
 * Page Parcours Marchand
 * Visualisation des 5 étapes clés de digitalisation
 */
export default function MerchantJourney() {
  const steps = [
    {
      id: 1,
      title: 'Approvisionnement & Paiement',
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      description: 'Commandez vos marchandises en ligne et payez en toute sécurité',
      features: [
        'Marché virtuel pour commander en ligne',
        'Paiements mobile money sécurisés',
        'Suivi en temps réel des commandes',
        'Traçabilité complète des livraisons',
      ],
      link: '/merchant/market',
      linkText: 'Accéder au Marché',
    },
    {
      id: 2,
      title: 'Vente au Client Final',
      icon: Wallet,
      color: 'from-green-500 to-green-600',
      description: 'Encaissez vos clients avec des solutions modernes',
      features: [
        'Encaissement par QR code',
        'Paiements mobile money',
        'Reçus électroniques automatiques',
        'Fidélisation des clients',
      ],
      link: '/merchant/cash-register',
      linkText: 'Ouvrir la Caisse',
    },
    {
      id: 3,
      title: 'Stockage & Gestion',
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      description: 'Gérez votre stock intelligemment avec des outils automatisés',
      features: [
        'Tableau de bord en temps réel',
        'Alertes de réapprovisionnement',
        'Suivi des ventes et du stock',
        'Réduction des pertes',
      ],
      link: '/merchant/stock',
      linkText: 'Gérer le Stock',
    },
    {
      id: 4,
      title: 'Protection Sociale',
      icon: Shield,
      color: 'from-orange-500 to-orange-600',
      description: 'Protégez-vous et votre famille avec la couverture sociale',
      features: [
        'Paiement cotisations CNPS en ligne',
        'Paiement cotisations CMU en ligne',
        'Suivi des renouvellements',
        'Inclusion sociale facilitée',
      ],
      link: '/merchant/social-protection',
      linkText: 'Ma Protection',
    },
    {
      id: 5,
      title: 'Renforcement des Capacités',
      icon: GraduationCap,
      color: 'from-pink-500 to-pink-600',
      description: 'Formez-vous en continu pour développer votre activité',
      features: [
        'Modules e-learning accessibles 24/7',
        'Tutoriels vidéo pratiques',
        'Formations sur la gestion',
        'Certificats de complétion',
      ],
      link: '/learning',
      linkText: 'Mes Formations',
    },
  ];

  const impacts = [
    {
      icon: TrendingUp,
      title: 'Efficacité Opérationnelle',
      description: 'Réduction des délais et des coûts de transaction',
    },
    {
      icon: CheckCircle2,
      title: 'Traçabilité & Transparence',
      description: 'Données exploitables pour le suivi des flux commerciaux',
    },
    {
      icon: Wallet,
      title: 'Inclusion Financière',
      description: 'Accès élargi aux paiements électroniques',
    },
    {
      icon: Shield,
      title: 'Inclusion Sociale',
      description: 'Protection sociale accessible à tous',
    },
    {
      icon: GraduationCap,
      title: 'Professionnalisation',
      description: 'Formation continue pour monter en compétences',
    },
    {
      icon: Clock,
      title: 'Gain de Temps',
      description: 'Automatisation des tâches répétitives',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            🚀 Mon Parcours de Digitalisation
          </h1>
          <p className="text-2xl md:text-3xl mb-8 max-w-4xl mx-auto">
            5 étapes pour transformer votre activité et augmenter vos revenus
          </p>
          <div className="flex items-center justify-center gap-4 text-xl">
            <Users className="w-8 h-8" />
            <span className="font-semibold">Rejoignez des milliers de marchands qui ont déjà franchi le pas !</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        
        {/* Les 5 Étapes */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Les 5 Étapes Clés de Votre Transformation
          </h2>
          
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.id} className="overflow-hidden hover:shadow-2xl transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    {/* Numéro et Icône */}
                    <div className={`bg-gradient-to-br ${step.color} text-white p-8 md:w-64 flex flex-col items-center justify-center`}>
                      <div className="text-6xl font-bold mb-4">
                        {step.id}
                      </div>
                      <Icon className="w-20 h-20 mb-4" />
                      <h3 className="text-2xl font-bold text-center">
                        {step.title}
                      </h3>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 p-8">
                      <p className="text-xl text-gray-700 mb-6">
                        {step.description}
                      </p>

                      {/* Features */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {step.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <Link href={step.link}>
                        <Button size="lg" className="group">
                          {step.linkText}
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Flèche de progression */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-4 bg-gray-50">
                      <ArrowRight className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Impacts Attendus */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            💡 Les Bénéfices pour Vous
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {impacts.map((impact, index) => {
              const Icon = impact.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-xl transition-shadow">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-orange-100 to-yellow-100 p-4 rounded-full mb-4">
                      <Icon className="w-12 h-12 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {impact.title}
                    </h3>
                    <p className="text-gray-600">
                      {impact.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Final */}
        <Card className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Prêt à Transformer Votre Activité ?
          </h2>
          <p className="text-2xl mb-8 max-w-3xl mx-auto">
            Rejoignez l'écosystème digital IFN Connect et profitez de tous les avantages de la digitalisation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchant/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Accéder à Mon Dashboard
              </Button>
            </Link>
            <Link href="/merchant/market">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-white text-orange-600 hover:bg-gray-100">
                Découvrir le Marché Virtuel
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
