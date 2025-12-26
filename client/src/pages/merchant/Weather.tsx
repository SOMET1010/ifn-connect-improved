import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { WeatherWidget } from "@/components/WeatherWidget";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function MerchantWeather() {
  const { user, merchant } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Vous devez être un marchand pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/merchant/dashboard">
              <a>
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </a>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🌤️ Météo & Conseils
              </h1>
              <p className="text-gray-600 mt-1">
                Informations météo pour optimiser ton commerce
              </p>
            </div>
          </div>
        </div>

        {/* Widget météo principal */}
        <WeatherWidget enabled={true} />

        {/* Informations complémentaires */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Pourquoi la météo est importante ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  ☀️ Temps ensoleillé
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Expose tes produits dehors pour attirer les clients</li>
                  <li>Les fruits et légumes se vendent mieux</li>
                  <li>Protège les produits périssables de la chaleur</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  🌧️ Temps pluvieux
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Range tes marchandises à l'abri</li>
                  <li>Prépare des bâches de protection</li>
                  <li>Les produits secs se vendent mieux</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  ☁️ Temps nuageux
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Conditions idéales pour exposer tous les produits</li>
                  <li>Surveille le ciel pour anticiper la pluie</li>
                  <li>Prépare-toi à ranger rapidement si besoin</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  ⛈️ Orage prévu
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Protège ton stock dès maintenant</li>
                  <li>Évite d'exposer les produits fragiles</li>
                  <li>Prépare-toi à fermer temporairement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Astuce SUTA */}
        <Card className="bg-gradient-to-r from-orange-100 to-green-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-white p-2 flex-shrink-0">
                <img
                  src="/suta-avatar-3d.png"
                  alt="SUTA"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">
                  💡 Astuce de SUTA
                </h3>
                <p className="text-gray-700">
                  Les informations météo sont mises à jour toutes les 5 minutes. 
                  Consulte cette page chaque matin pour planifier ta journée de vente 
                  et maximiser tes profits ! 🚀
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
