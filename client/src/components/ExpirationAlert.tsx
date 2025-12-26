import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExpirationAlertProps {
  cnpsExpiryDate?: Date | null;
  cmuExpiryDate?: Date | null;
  rstiExpiryDate?: Date | null;
}

/**
 * Composant d'alerte d'expiration de couverture sociale
 * Affiche un badge d'alerte si une couverture expire dans moins de 30 jours
 */
export function ExpirationAlert({ cnpsExpiryDate, cmuExpiryDate, rstiExpiryDate }: ExpirationAlertProps) {
  const [, setLocation] = useLocation();

  const getExpiringProtections = () => {
    const expiring: Array<{ type: string; date: Date; days: number }> = [];

    if (cnpsExpiryDate) {
      const days = differenceInDays(new Date(cnpsExpiryDate), new Date());
      if (days >= 0 && days <= 30) {
        expiring.push({ type: 'CNPS', date: new Date(cnpsExpiryDate), days });
      }
    }

    if (cmuExpiryDate) {
      const days = differenceInDays(new Date(cmuExpiryDate), new Date());
      if (days >= 0 && days <= 30) {
        expiring.push({ type: 'CMU', date: new Date(cmuExpiryDate), days });
      }
    }

    if (rstiExpiryDate) {
      const days = differenceInDays(new Date(rstiExpiryDate), new Date());
      if (days >= 0 && days <= 30) {
        expiring.push({ type: 'RSTI', date: new Date(rstiExpiryDate), days });
      }
    }

    return expiring;
  };

  const expiringProtections = getExpiringProtections();

  if (expiringProtections.length === 0) {
    return null;
  }

  const mostUrgent = expiringProtections.reduce((prev, current) => 
    prev.days < current.days ? prev : current
  );

  return (
    <Alert variant="destructive" className="border-orange-500 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">
        Couverture sociale à renouveler
      </AlertTitle>
      <AlertDescription className="text-orange-800">
        <div className="space-y-2">
          {expiringProtections.map((protection) => (
            <p key={protection.type}>
              Votre <strong>{protection.type}</strong> expire{' '}
              {protection.days === 0 ? (
                <strong className="text-red-600">aujourd'hui</strong>
              ) : protection.days === 1 ? (
                <strong className="text-red-600">demain</strong>
              ) : (
                <>
                  dans <strong>{protection.days} jours</strong> (
                  {format(protection.date, 'dd MMMM yyyy', { locale: fr })})
                </>
              )}
            </p>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 bg-white hover:bg-orange-100 text-orange-900 border-orange-300"
            onClick={() => setLocation('/merchant/social-protection')}
          >
            Renouveler maintenant
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
