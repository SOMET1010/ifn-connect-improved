/**
 * Composant PinPad - Clavier numérique visuel pour saisie PIN
 * Design ultra-simplifié pour marchands sans culture numérique
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PinPadProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  masked?: boolean;
  className?: string;
}

export function PinPad({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled = false,
  masked = true,
  className,
}: PinPadProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleDigit = (digit: string) => {
    if (disabled || localValue.length >= length) return;

    const newValue = localValue + digit;
    setLocalValue(newValue);
    onChange(newValue);

    // Vibration tactile sur mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Annonce vocale
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(digit);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.2;
      utterance.volume = 0.5;
      window.speechSynthesis.speak(utterance);
    }

    // Appeler onComplete si la longueur est atteinte
    if (newValue.length === length && onComplete) {
      setTimeout(() => onComplete(newValue), 300);
    }
  };

  const handleDelete = () => {
    if (disabled || localValue.length === 0) return;

    const newValue = localValue.slice(0, -1);
    setLocalValue(newValue);
    onChange(newValue);

    // Vibration tactile
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const handleClear = () => {
    if (disabled) return;

    setLocalValue('');
    onChange('');

    // Vibration tactile
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Affichage des points/chiffres */}
      <div className="flex justify-center gap-4 mb-8">
        {Array.from({ length }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-16 h-16 rounded-2xl border-4 flex items-center justify-center text-3xl font-bold transition-all',
              index < localValue.length
                ? 'border-primary bg-primary/10 scale-110'
                : 'border-muted bg-muted/20'
            )}
            role="status"
            aria-label={`Chiffre ${index + 1}${index < localValue.length ? ' saisi' : ' vide'}`}
          >
            {index < localValue.length && (
              masked ? '●' : localValue[index]
            )}
          </div>
        ))}
      </div>

      {/* Clavier numérique */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {digits.map((digit) => (
          <Button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={disabled || localValue.length >= length}
            size="lg"
            variant="outline"
            className={cn(
              'h-20 text-4xl font-bold rounded-2xl',
              'hover:scale-105 active:scale-95 transition-transform',
              'border-2 hover:border-primary hover:bg-primary/10',
              'focus:ring-4 focus:ring-primary/20'
            )}
            aria-label={`Chiffre ${digit}`}
          >
            {digit}
          </Button>
        ))}
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleClear}
          disabled={disabled || localValue.length === 0}
          size="lg"
          variant="outline"
          className={cn(
            'h-16 text-xl font-semibold rounded-2xl',
            'hover:bg-destructive/10 hover:border-destructive hover:text-destructive',
            'focus:ring-4 focus:ring-destructive/20'
          )}
          aria-label="Effacer tout"
        >
          🗑️ Effacer
        </Button>

        <Button
          onClick={handleDelete}
          disabled={disabled || localValue.length === 0}
          size="lg"
          variant="outline"
          className={cn(
            'h-16 text-xl font-semibold rounded-2xl',
            'hover:bg-warning/10 hover:border-warning hover:text-warning',
            'focus:ring-4 focus:ring-warning/20'
          )}
          aria-label="Supprimer le dernier chiffre"
        >
          ⌫ Retour
        </Button>
      </div>

      {/* Indicateur de progression */}
      <div className="mt-6">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(localValue.length / length) * 100}%` }}
            role="progressbar"
            aria-valuenow={localValue.length}
            aria-valuemin={0}
            aria-valuemax={length}
            aria-label="Progression de la saisie"
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {localValue.length} / {length} chiffres saisis
        </p>
      </div>
    </div>
  );
}
