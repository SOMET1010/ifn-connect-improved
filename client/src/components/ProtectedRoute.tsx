import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'merchant' | 'agent' | 'admin';
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackPath = '/' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      // Si pas connecté, rediriger vers la page d'accueil
      if (!user) {
        setLocation(fallbackPath);
        return;
      }

      // Si un rôle est requis et que l'utilisateur ne l'a pas
      if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        setLocation(fallbackPath);
        return;
      }
    }
  }, [user, isLoading, requiredRole, fallbackPath, setLocation]);

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si pas connecté ou pas le bon rôle, ne rien afficher (la redirection est en cours)
  if (!user || (requiredRole && user.role !== requiredRole && user.role !== 'admin')) {
    return null;
  }

  // Sinon, afficher le contenu protégé
  return <>{children}</>;
}
