import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Cloud, Droplets, Wind, AlertTriangle } from "lucide-react";

interface WeatherWidgetProps {
  enabled?: boolean;
}

export function WeatherWidget({ enabled = true }: WeatherWidgetProps) {
  // Récupérer la météo complète avec conseils
  const { data: weatherData, isLoading } = trpc.weather.full.useQuery(
    undefined,
    { 
      enabled,
      refetchInterval: 300000 // Rafraîchir toutes les 5 minutes
    }
  );

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-blue-600">Chargement météo...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return null;
  }

  const { weather, advices } = weatherData;

  // Déterminer le gradient de fond selon la météo
  const getBackgroundGradient = () => {
    if (weather.rain) {
      return "from-gray-400 to-gray-600";
    }
    if (weather.condition === "Clear") {
      return "from-yellow-300 to-orange-400";
    }
    if (weather.clouds > 70) {
      return "from-gray-300 to-gray-500";
    }
    return "from-blue-300 to-blue-500";
  };

  // Conseil prioritaire (le plus important)
  const priorityAdvice = advices.find(a => a.priority === 'high') || advices[0];

  return (
    <div className="space-y-3">
      {/* Widget météo principal */}
      <Card className={`bg-gradient-to-br ${getBackgroundGradient()} border-none text-white shadow-lg`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-6xl">{weather.icon}</div>
              <div>
                <div className="text-4xl font-bold">{weather.temperature}°C</div>
                <div className="text-sm opacity-90 capitalize">{weather.description}</div>
              </div>
            </div>
            
            <div className="text-right space-y-1">
              <div className="flex items-center justify-end space-x-2 text-sm">
                <Droplets className="h-4 w-4" />
                <span>{weather.humidity}%</span>
              </div>
              <div className="flex items-center justify-end space-x-2 text-sm">
                <Wind className="h-4 w-4" />
                <span>{weather.windSpeed} km/h</span>
              </div>
              <div className="flex items-center justify-end space-x-2 text-sm">
                <Cloud className="h-4 w-4" />
                <span>{weather.clouds}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conseil météo prioritaire */}
      {priorityAdvice && (
        <Card className={`border-2 ${
          priorityAdvice.priority === 'high' 
            ? 'border-red-500 bg-red-50' 
            : priorityAdvice.priority === 'medium'
            ? 'border-orange-500 bg-orange-50'
            : 'border-blue-500 bg-blue-50'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              {priorityAdvice.priority === 'high' && (
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {priorityAdvice.message}
                </p>
                {priorityAdvice.action && (
                  <p className="text-xs text-gray-600 mt-1">
                    👉 {priorityAdvice.action}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Autres conseils (si plusieurs) */}
      {advices.length > 1 && (
        <div className="space-y-2">
          {advices.slice(1).map((advice, index) => (
            <Card key={index} className="border border-gray-200 bg-white">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-gray-700">
                  {advice.icon} {advice.message}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
