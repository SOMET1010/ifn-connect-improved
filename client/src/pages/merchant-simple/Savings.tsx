import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Wallet } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';

export default function MerchantSavings() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/merchant')}
        className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-100 text-gray-700 p-4 rounded-full shadow-lg transition-all"
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 bg-yellow-500 text-white px-8 py-4 rounded-full shadow-lg">
            <Wallet className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              MON ARGENT
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border-4 border-yellow-200">
            <div className="text-center space-y-6">
              <div className="text-8xl mb-8">💰</div>
              <h2 className="text-4xl font-bold text-gray-900">Bientôt disponible</h2>
              <p className="text-2xl text-gray-600">
                Tu pourras voir ton épargne et tes gains ici
              </p>
              <button
                onClick={() => setLocation('/merchant')}
                className="mt-8 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-12 py-6 rounded-2xl text-2xl font-bold shadow-lg transform hover:scale-105 transition-all"
              >
                Retour au menu
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
