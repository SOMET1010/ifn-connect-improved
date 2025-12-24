import { LucideIcon } from 'lucide-react';
import { audioManager } from '@/lib/audioManager';
import AudioButton from './AudioButton';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  pictogramSrc?: string;
  audioKey: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'default';
  size?: 'default' | 'lg';
  badge?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Carte d'action tactile avec pictogramme et feedback audio
 * Optimisée pour l'accessibilité avec grandes zones tactiles
 */
export default function ActionCard({
  title,
  description,
  icon: Icon,
  pictogramSrc,
  audioKey,
  onClick,
  variant = 'default',
  size = 'default',
  badge,
  disabled = false,
  className,
}: ActionCardProps) {
  const handleClick = () => {
    if (disabled) return;
    
    audioManager.provideFeedback('tap');
    onClick();
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
    default: 'bg-card text-card-foreground hover:bg-muted',
  };

  const sizeClasses = {
    default: 'min-h-[120px] p-4',
    lg: 'min-h-[160px] p-6',
  };

  return (
    <div
      className={cn(
        'card-tactile relative group',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={title}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Badge de notification */}
      {badge && (
        <div className="notification-badge">
          {badge}
        </div>
      )}

      {/* Bouton audio */}
      <div className="absolute top-2 right-2 z-10">
        <AudioButton
          instructionKey={audioKey}
          size="sm"
          variant="ghost"
        />
      </div>

      {/* Contenu */}
      <div className="flex flex-col items-center text-center gap-3 mt-2">
        {/* Pictogramme ou Icône */}
        {pictogramSrc ? (
          <div className="pictogram-lg">
            <img
              src={pictogramSrc}
              alt={title}
              className="w-full h-full object-contain"
            />
          </div>
        ) : Icon ? (
          <div className="pictogram-lg">
            <Icon size={48} />
          </div>
        ) : null}

        {/* Titre */}
        <h3 className="text-xl font-bold text-balance">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm opacity-90 text-balance">
          {description}
        </p>
      </div>

      {/* Effet hover */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-ring transition-colors pointer-events-none" />
    </div>
  );
}
