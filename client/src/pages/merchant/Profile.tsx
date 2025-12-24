import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Camera, Award, TrendingUp, Calendar, MapPin, Phone, CreditCard, Shield, Trophy } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { toast } from 'sonner';

/**
 * Page de Profil Marchand avec Identité Professionnelle
 * Affiche le code MRC, le niveau, les statistiques et la couverture sociale
 */
export default function MerchantProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);

  // Récupérer les données du marchand
  const { data: merchant, isLoading } = trpc.auth.myMerchant.useQuery();

  // Récupérer les statistiques
  const { data: stats } = trpc.sales.totalBalance.useQuery(
    { merchantId: merchant?.id || 0 },
    { enabled: !!merchant }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <InstitutionalHeader />
        <div className="container mx-auto px-4 py-8">
          <p className="text-3xl text-center">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <InstitutionalHeader />
        <div className="container mx-auto px-4 py-8">
          <p className="text-3xl text-center text-red-600">Marchand non trouvé</p>
        </div>
      </div>
    );
  }

  // Calculer le niveau basé sur les ventes (simplifié pour l'instant)
  const totalSales = typeof stats === 'number' ? stats : 0;
  let level = 'Débutant';
  let levelColor = 'bg-gray-500';
  let nextLevel = 'Intermédiaire';
  let progress = 0;

  if (totalSales >= 5000000) {
    level = 'Maître';
    levelColor = 'bg-purple-600';
    nextLevel = 'Maître';
    progress = 100;
  } else if (totalSales >= 2000000) {
    level = 'Expert';
    levelColor = 'bg-blue-600';
    nextLevel = 'Maître';
    progress = ((totalSales - 2000000) / 3000000) * 100;
  } else if (totalSales >= 500000) {
    level = 'Confirmé';
    levelColor = 'bg-green-600';
    nextLevel = 'Expert';
    progress = ((totalSales - 500000) / 1500000) * 100;
  } else if (totalSales >= 100000) {
    level = 'Intermédiaire';
    levelColor = 'bg-yellow-600';
    nextLevel = 'Confirmé';
    progress = ((totalSales - 100000) / 400000) * 100;
  } else {
    level = 'Débutant';
    levelColor = 'bg-gray-500';
    nextLevel = 'Intermédiaire';
    progress = (totalSales / 100000) * 100;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      <InstitutionalHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Bouton retour */}
        <button
          onClick={() => setLocation('/merchant/dashboard')}
          className="mb-8 bg-gray-200 hover:bg-gray-300 rounded-2xl px-8 py-6 flex items-center gap-4 text-3xl font-bold text-gray-700 transition-all hover:scale-105"
        >
          <ArrowLeft className="w-12 h-12" />
          Retour
        </button>

        {/* Carte principale du profil */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Photo de profil */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-8xl font-bold shadow-2xl">
                  {merchant.businessName?.charAt(0).toUpperCase() || 'M'}
                </div>
                
                {/* Bouton pour changer la photo */}
                <button
                  onClick={() => {
                    toast.info('Fonctionnalité bientôt disponible !');
                  }}
                  className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 rounded-full p-4 shadow-xl transition-all hover:scale-110"
                >
                  <Camera className="w-8 h-8 text-gray-700" />
                </button>
              </div>

              {/* Badge de niveau */}
              <div className={`mt-8 ${levelColor} text-white rounded-2xl px-8 py-4 flex items-center gap-3 shadow-xl`}>
                <Award className="w-10 h-10" />
                <span className="text-3xl font-bold">{level}</span>
              </div>
            </div>

            {/* Informations principales */}
            <div className="flex-1">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">{merchant.businessName}</h1>
              
              {/* Code MRC en TRÈS GRAND */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 mb-8 text-white">
                <p className="text-3xl mb-2">Code Marchand</p>
                <p className="text-7xl font-bold tracking-wider">{merchant.merchantNumber}</p>
              </div>

              {/* Informations de contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-6">
                  <Phone className="w-10 h-10 text-orange-600" />
                  <div>
                    <p className="text-xl text-gray-600">Téléphone</p>
                    <p className="text-2xl font-bold text-gray-900">{user?.phone || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-6">
                  <MapPin className="w-10 h-10 text-orange-600" />
                  <div>
                    <p className="text-xl text-gray-600">Marché</p>
                    <p className="text-2xl font-bold text-gray-900">{merchant.location || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-6">
                  <Calendar className="w-10 h-10 text-orange-600" />
                  <div>
                    <p className="text-xl text-gray-600">Membre depuis</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Date(merchant.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-6">
                  <TrendingUp className="w-10 h-10 text-orange-600" />
                  <div>
                    <p className="text-xl text-gray-600">Ventes totales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalSales.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              </div>

              {/* Progression vers le niveau suivant */}
              {level !== 'Maître' && (
                <div className="bg-blue-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-2xl font-bold text-gray-900">
                      Progression vers {nextLevel}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(progress)}%
                    </p>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Couverture sociale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* CNPS */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-100 rounded-2xl p-4">
                <Shield className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900">CNPS</h2>
            </div>

            <div className={`rounded-2xl p-6 mb-6 ${
              merchant.cnpsStatus === 'active' ? 'bg-green-100' : 
              merchant.cnpsStatus === 'inactive' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <p className="text-2xl mb-2">Statut</p>
              <p className="text-5xl font-bold">
                {merchant.cnpsStatus === 'active' ? '✅ Actif' :
                 merchant.cnpsStatus === 'inactive' ? '❌ Inactif' : '⏳ En attente'}
              </p>
            </div>

            {merchant.cnpsNumber && (
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <p className="text-2xl text-gray-600 mb-2">Numéro CNPS</p>
                <p className="text-3xl font-bold text-gray-900">{merchant.cnpsNumber}</p>
              </div>
            )}

            <button
              onClick={() => setLocation('/merchant/social-coverage')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl py-6 text-3xl font-bold transition-all hover:scale-105"
            >
              Voir les détails
            </button>
          </div>

          {/* CMU */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-100 rounded-2xl p-4">
                <CreditCard className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900">CMU</h2>
            </div>

            <div className={`rounded-2xl p-6 mb-6 ${
              merchant.cmuStatus === 'active' ? 'bg-green-100' : 
              merchant.cmuStatus === 'inactive' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <p className="text-2xl mb-2">Statut</p>
              <p className="text-5xl font-bold">
                {merchant.cmuStatus === 'active' ? '✅ Actif' :
                 merchant.cmuStatus === 'inactive' ? '❌ Inactif' : '⏳ En attente'}
              </p>
            </div>

            {merchant.cmuNumber && (
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <p className="text-2xl text-gray-600 mb-2">Numéro CMU</p>
                <p className="text-3xl font-bold text-gray-900">{merchant.cmuNumber}</p>
              </div>
            )}

            <button
              onClick={() => setLocation('/merchant/social-coverage')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl py-6 text-3xl font-bold transition-all hover:scale-105"
            >
              Voir les détails
            </button>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => {
              toast.info('Certificat professionnel bientôt disponible !');
            }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-3xl p-12 text-4xl font-bold shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-6"
          >
            <Award className="w-16 h-16" />
            Télécharger mon Certificat
          </button>

          <button
                onClick={() => setLocation('/merchant/badges')}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-3xl p-12 text-4xl font-bold shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-6"
          >
            <Award className="w-16 h-16" />
            Mes Badges
          </button>
        </div>
      </div>
    </div>
  );
}
