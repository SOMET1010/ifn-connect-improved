import { useLocation } from 'wouter';
import { UserCheck, ArrowLeft, Users, ClipboardList } from 'lucide-react';
import InstitutionalHeader from '@/components/InstitutionalHeader';

export default function AgentDashboard() {
  const [, setLocation] = useLocation();

  const buttons = [
    {
      id: 'marchands',
      title: 'MES MARCHANDS',
      subtitle: 'Voir la liste',
      icon: Users,
      route: '#',
      gradient: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    },
    {
      id: 'taches',
      title: 'MES TÂCHES',
      subtitle: 'À faire aujourd\'hui',
      icon: ClipboardList,
      route: '#',
      gradient: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <InstitutionalHeader />

      <button
        onClick={() => setLocation('/')}
        className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-100 text-gray-700 p-4 rounded-full shadow-lg transition-all"
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Espace Agent
          </h1>
          <p className="text-2xl md:text-3xl text-gray-600">
            Que veux-tu faire ?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {buttons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={() => btn.route !== '#' && setLocation(btn.route)}
                className={`
                  bg-gradient-to-r ${btn.gradient}
                  text-white rounded-3xl shadow-2xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-300
                  p-12 md:p-16
                  group relative
                  min-h-[300px] md:min-h-[350px]
                  flex flex-col items-center justify-center gap-6
                `}
              >
                <div className="bg-white/20 p-8 rounded-full group-hover:bg-white/30 transition-colors">
                  <Icon className="w-24 h-24 md:w-32 md:h-32 text-white" strokeWidth={2.5} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-4xl md:text-5xl font-black">
                    {btn.title}
                  </h2>
                  <p className="text-xl md:text-2xl text-white/90">
                    {btn.subtitle}
                  </p>
                </div>

                {btn.route === '#' && (
                  <div className="absolute top-6 right-6 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold">
                    Bientôt
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-green-100 border-4 border-green-300 rounded-2xl p-8">
            <p className="text-3xl text-green-900 font-bold">
              🎯 Ton rôle
            </p>
            <p className="text-2xl text-green-700 mt-2">
              Aider les marchands au quotidien
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
