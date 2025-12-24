import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Shield, CreditCard, Calendar, AlertTriangle, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import InstitutionalHeader from '@/components/InstitutionalHeader';
import { toast } from 'sonner';

/**
 * Dashboard de Couverture Sociale CNPS/CMU
 * Affiche les statuts, dates d'expiration, compteurs et permet de télécharger les attestations
 */
export default function SocialCoverage() {
  const [, setLocation] = useLocation();
  const { merchant } = useAuth();

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

  // Calculer les jours restants depuis les vraies dates de la base de données
  const cnpsExpiryDate = merchant.cnpsExpiryDate ? new Date(merchant.cnpsExpiryDate) : null;
  const cmuExpiryDate = merchant.cmuExpiryDate ? new Date(merchant.cmuExpiryDate) : null;

  const cnpsDaysLeft = cnpsExpiryDate ? Math.ceil((cnpsExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const cmuDaysLeft = cmuExpiryDate ? Math.ceil((cmuExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const cnpsNeedsRenewal = cnpsDaysLeft > 0 && cnpsDaysLeft < 30;
  const cmuNeedsRenewal = cmuDaysLeft > 0 && cmuDaysLeft < 30;

  const handleDownloadAttestation = (type: 'cnps' | 'cmu') => {
    toast.info(`📄 Téléchargement de l'attestation ${type.toUpperCase()} bientôt disponible !`);
  };

  const handleRenew = (type: 'cnps' | 'cmu') => {
    toast.info(`🔄 Renouvellement ${type.toUpperCase()} : Contactez votre agent terrain !`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      <InstitutionalHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Bouton retour */}
        <button
          onClick={() => setLocation('/merchant/profile')}
          className="mb-8 bg-gray-200 hover:bg-gray-300 rounded-2xl px-8 py-6 flex items-center gap-4 text-3xl font-bold text-gray-700 transition-all hover:scale-105"
        >
          <ArrowLeft className="w-12 h-12" />
          Retour au Profil
        </button>

        {/* Titre */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            🛡️ Ma Couverture Sociale
          </h1>
          <p className="text-3xl text-gray-700">
            CNPS (Retraite) et CMU (Santé)
          </p>
        </div>

        {/* Alertes globales */}
        {(cnpsNeedsRenewal || cmuNeedsRenewal) && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-12 mb-12 text-white shadow-2xl animate-pulse">
            <div className="flex items-center gap-6">
              <AlertTriangle className="w-24 h-24" strokeWidth={3} />
              <div>
                <h2 className="text-5xl font-bold mb-4">⚠️ ATTENTION !</h2>
                <p className="text-3xl">
                  {cnpsNeedsRenewal && cmuNeedsRenewal
                    ? 'Votre CNPS et CMU expirent bientôt !'
                    : cnpsNeedsRenewal
                    ? 'Votre CNPS expire bientôt !'
                    : 'Votre CMU expire bientôt !'}
                </p>
                <p className="text-2xl mt-2 text-red-100">
                  Contactez votre agent terrain pour renouveler
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cartes CNPS et CMU */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          
          {/* CARTE CNPS */}
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="bg-blue-100 rounded-2xl p-6">
                  <Shield className="w-20 h-20 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-5xl font-bold text-gray-900">CNPS</h2>
                  <p className="text-2xl text-gray-600">Caisse Nationale de Prévoyance Sociale</p>
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className={`rounded-3xl p-10 mb-8 ${
              merchant.cnpsStatus === 'active' ? 'bg-green-100' : 
              merchant.cnpsStatus === 'inactive' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <div className="flex items-center gap-6 mb-4">
                {merchant.cnpsStatus === 'active' ? (
                  <CheckCircle className="w-16 h-16 text-green-600" strokeWidth={3} />
                ) : merchant.cnpsStatus === 'inactive' ? (
                  <XCircle className="w-16 h-16 text-red-600" strokeWidth={3} />
                ) : (
                  <Clock className="w-16 h-16 text-yellow-600" strokeWidth={3} />
                )}
                <div>
                  <p className="text-3xl mb-2">Statut</p>
                  <p className="text-6xl font-bold">
                    {merchant.cnpsStatus === 'active' ? '✅ ACTIF' :
                     merchant.cnpsStatus === 'inactive' ? '❌ INACTIF' : '⏳ EN ATTENTE'}
                  </p>
                </div>
              </div>
            </div>

            {/* Numéro */}
            {merchant.cnpsNumber && (
              <div className="bg-gray-50 rounded-2xl p-8 mb-8">
                <p className="text-2xl text-gray-600 mb-2">Numéro CNPS</p>
                <p className="text-4xl font-bold text-gray-900">{merchant.cnpsNumber}</p>
              </div>
            )}

            {/* Date d'expiration et compteur */}
            {merchant.cnpsStatus === 'active' && cnpsExpiryDate && (
              <>
                <div className="bg-blue-50 rounded-2xl p-8 mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Calendar className="w-12 h-12 text-blue-600" />
                    <p className="text-3xl font-bold text-gray-900">Date d'expiration</p>
                  </div>
                  <p className="text-5xl font-bold text-blue-600">
                    {cnpsExpiryDate.toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Compteur de jours */}
                <div className={`rounded-2xl p-8 mb-8 ${
                  cnpsNeedsRenewal ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <p className="text-3xl mb-4">Jours restants</p>
                  <p className={`text-8xl font-bold ${
                    cnpsNeedsRenewal ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {cnpsDaysLeft}
                  </p>
                  <p className="text-2xl text-gray-700 mt-2">jours</p>
                </div>
              </>
            )}

            {/* Boutons d'action */}
            <div className="space-y-4">
              {merchant.cnpsStatus === 'active' && (
                <button
                  onClick={() => handleDownloadAttestation('cnps')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl py-8 text-3xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-4"
                >
                  <Download className="w-12 h-12" />
                  Télécharger l'attestation
                </button>
              )}
              
              {(merchant.cnpsStatus === 'inactive' || cnpsNeedsRenewal) && (
                <button
                  onClick={() => handleRenew('cnps')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl py-8 text-3xl font-bold transition-all hover:scale-105"
                >
                  🔄 Renouveler ma CNPS
                </button>
              )}
            </div>
          </div>

          {/* CARTE CMU */}
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="bg-green-100 rounded-2xl p-6">
                  <CreditCard className="w-20 h-20 text-green-600" />
                </div>
                <div>
                  <h2 className="text-5xl font-bold text-gray-900">CMU</h2>
                  <p className="text-2xl text-gray-600">Couverture Maladie Universelle</p>
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className={`rounded-3xl p-10 mb-8 ${
              merchant.cmuStatus === 'active' ? 'bg-green-100' : 
              merchant.cmuStatus === 'inactive' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <div className="flex items-center gap-6 mb-4">
                {merchant.cmuStatus === 'active' ? (
                  <CheckCircle className="w-16 h-16 text-green-600" strokeWidth={3} />
                ) : merchant.cmuStatus === 'inactive' ? (
                  <XCircle className="w-16 h-16 text-red-600" strokeWidth={3} />
                ) : (
                  <Clock className="w-16 h-16 text-yellow-600" strokeWidth={3} />
                )}
                <div>
                  <p className="text-3xl mb-2">Statut</p>
                  <p className="text-6xl font-bold">
                    {merchant.cmuStatus === 'active' ? '✅ ACTIF' :
                     merchant.cmuStatus === 'inactive' ? '❌ INACTIF' : '⏳ EN ATTENTE'}
                  </p>
                </div>
              </div>
            </div>

            {/* Numéro */}
            {merchant.cmuNumber && (
              <div className="bg-gray-50 rounded-2xl p-8 mb-8">
                <p className="text-2xl text-gray-600 mb-2">Numéro CMU</p>
                <p className="text-4xl font-bold text-gray-900">{merchant.cmuNumber}</p>
              </div>
            )}

            {/* Date d'expiration et compteur */}
            {merchant.cmuStatus === 'active' && cmuExpiryDate && (
              <>
                <div className="bg-green-50 rounded-2xl p-8 mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Calendar className="w-12 h-12 text-green-600" />
                    <p className="text-3xl font-bold text-gray-900">Date d'expiration</p>
                  </div>
                  <p className="text-5xl font-bold text-green-600">
                    {cmuExpiryDate.toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Compteur de jours */}
                <div className={`rounded-2xl p-8 mb-8 ${
                  cmuNeedsRenewal ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <p className="text-3xl mb-4">Jours restants</p>
                  <p className={`text-8xl font-bold ${
                    cmuNeedsRenewal ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {cmuDaysLeft}
                  </p>
                  <p className="text-2xl text-gray-700 mt-2">jours</p>
                </div>
              </>
            )}

            {/* Boutons d'action */}
            <div className="space-y-4">
              {merchant.cmuStatus === 'active' && (
                <button
                  onClick={() => handleDownloadAttestation('cmu')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl py-8 text-3xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-4"
                >
                  <Download className="w-12 h-12" />
                  Télécharger l'attestation
                </button>
              )}
              
              {(merchant.cmuStatus === 'inactive' || cmuNeedsRenewal) && (
                <button
                  onClick={() => handleRenew('cmu')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl py-8 text-3xl font-bold transition-all hover:scale-105"
                >
                  🔄 Renouveler ma CMU
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informations importantes */}
        <div className="bg-blue-50 rounded-3xl p-12 shadow-xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">ℹ️ Informations importantes</h2>
          <div className="space-y-4 text-2xl text-gray-700">
            <p>• <strong>CNPS</strong> : Assure votre retraite et vos prestations familiales</p>
            <p>• <strong>CMU</strong> : Couvre vos frais de santé et ceux de votre famille</p>
            <p>• <strong>Renouvellement</strong> : Contactez votre agent terrain au moins 30 jours avant expiration</p>
            <p>• <strong>Attestations</strong> : Téléchargez-les pour vos démarches administratives</p>
          </div>
        </div>
      </div>
    </div>
  );
}
