import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CountdownTimerProps {
  closingDate: Date;
  onExpire?: () => void;
}

export function CountdownTimer({ closingDate, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date().getTime();
    const target = new Date(closingDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      expired: false,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [closingDate, onExpire]);

  if (timeLeft.expired) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-300 gap-1" variant="outline">
        <AlertCircle className="h-3 w-3" />
        Expiré
      </Badge>
    );
  }

  // Calculer le total de jours pour la couleur
  const totalDays = timeLeft.days;
  const colorClass =
    totalDays > 7
      ? 'bg-green-100 text-green-700 border-green-300'
      : totalDays >= 3
      ? 'bg-orange-100 text-orange-700 border-orange-300'
      : 'bg-red-100 text-red-700 border-red-300';

  // Format d'affichage selon le temps restant
  let displayText = '';
  if (timeLeft.days > 0) {
    displayText = `${timeLeft.days}j ${timeLeft.hours}h`;
  } else if (timeLeft.hours > 0) {
    displayText = `${timeLeft.hours}h ${timeLeft.minutes}min`;
  } else {
    displayText = `${timeLeft.minutes}min ${timeLeft.seconds}s`;
  }

  return (
    <Badge className={`${colorClass} gap-1 font-mono`} variant="outline">
      <Clock className="h-3 w-3" />
      {displayText}
    </Badge>
  );
}

interface CountdownDisplayProps {
  closingDate: Date | null;
}

export function CountdownDisplay({ closingDate }: CountdownDisplayProps) {
  if (!closingDate) {
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-300 gap-1" variant="outline">
        <Clock className="h-3 w-3" />
        Pas de limite
      </Badge>
    );
  }

  return <CountdownTimer closingDate={closingDate} />;
}
