/**
 * Composant PhoneInput - Saisie de numéro de téléphone ivoirien
 * Avec indicatif +225 pré-rempli et formatage automatique
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  className,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Formater le numéro pour l'affichage
    const formatted = formatPhoneDisplay(value);
    setDisplayValue(formatted);
  }, [value]);

  const formatPhoneDisplay = (phone: string): string => {
    // Retirer tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '');
    
    // Si commence par 225, retirer
    const withoutPrefix = cleaned.startsWith('225') ? cleaned.slice(3) : cleaned;
    
    // Formater en groupes : 07 08 45 98 37
    if (withoutPrefix.length <= 2) return withoutPrefix;
    if (withoutPrefix.length <= 4) return `${withoutPrefix.slice(0, 2)} ${withoutPrefix.slice(2)}`;
    if (withoutPrefix.length <= 6) return `${withoutPrefix.slice(0, 2)} ${withoutPrefix.slice(2, 4)} ${withoutPrefix.slice(4)}`;
    if (withoutPrefix.length <= 8) return `${withoutPrefix.slice(0, 2)} ${withoutPrefix.slice(2, 4)} ${withoutPrefix.slice(4, 6)} ${withoutPrefix.slice(6)}`;
    return `${withoutPrefix.slice(0, 2)} ${withoutPrefix.slice(2, 4)} ${withoutPrefix.slice(4, 6)} ${withoutPrefix.slice(6, 8)} ${withoutPrefix.slice(8, 10)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Retirer tous les caractères non numériques
    const cleaned = input.replace(/\D/g, '');
    
    // Limiter à 10 chiffres
    const limited = cleaned.slice(0, 10);
    
    // Mettre à jour la valeur
    onChange(limited);

    // Vibration tactile
    if ('vibrate' in navigator && limited.length > value.replace(/\D/g, '').length) {
      navigator.vibrate(30);
    }

    // Si 10 chiffres saisis, appeler onComplete
    if (limited.length === 10 && onComplete) {
      // Formater en +225XXXXXXXXX
      const formatted = `+225${limited.startsWith('0') ? limited.slice(1) : limited}`;
      setTimeout(() => onComplete(formatted), 300);
    }
  };

  const handleFocus = () => {
    // Annonce vocale
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Saisissez votre numéro de téléphone');
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isComplete = value.replace(/\D/g, '').length === 10;

  return (
    <div className={cn('w-full', className)}>
      <Label 
        htmlFor="phone-input" 
        className="text-xl font-semibold mb-3 flex items-center gap-2"
      >
        <span className="text-3xl">📱</span>
        Numéro de téléphone
      </Label>
      
      <div className="relative">
        {/* Indicatif +225 fixe */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground pointer-events-none">
          +225
        </div>

        {/* Champ de saisie */}
        <Input
          ref={inputRef}
          id="phone-input"
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder="07 08 45 98 37"
          className={cn(
            'h-16 pl-24 pr-4 text-2xl font-mono rounded-2xl border-2',
            'focus:ring-4 focus:ring-primary/20',
            isComplete && 'border-green-500 bg-green-50',
            error && 'border-red-500 bg-red-50',
            'transition-all'
          )}
          aria-label="Numéro de téléphone"
          aria-describedby={error ? 'phone-error' : undefined}
          aria-invalid={!!error}
        />

        {/* Icône de validation */}
        {isComplete && !error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl animate-bounce">
            ✅
          </div>
        )}

        {/* Icône d'erreur */}
        {error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl">
            ❌
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <p 
          id="phone-error" 
          className="mt-2 text-lg text-red-600 font-semibold flex items-center gap-2"
          role="alert"
        >
          <span>⚠️</span>
          {error}
        </p>
      )}

      {/* Indicateur de progression */}
      <div className="mt-3">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              isComplete ? 'bg-green-500' : 'bg-primary'
            )}
            style={{ width: `${(value.replace(/\D/g, '').length / 10) * 100}%` }}
            role="progressbar"
            aria-valuenow={value.replace(/\D/g, '').length}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-label="Progression de la saisie"
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-1">
          {value.replace(/\D/g, '').length} / 10 chiffres
        </p>
      </div>

      {/* Aide visuelle */}
      <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <p className="text-sm text-blue-900 flex items-center gap-2">
          <span className="text-xl">💡</span>
          <span>
            Exemple : <strong>07 08 45 98 37</strong> ou <strong>0708459837</strong>
          </span>
        </p>
      </div>
    </div>
  );
}
