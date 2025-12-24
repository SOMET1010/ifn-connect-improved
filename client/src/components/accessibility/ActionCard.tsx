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
    primary: 'bg-gradient-to-br from-primary/10 via-background to-accent/5 border-2 border-primary/40 hover:border-primary hover:shadow-xl text-foreground',
    secondary: 'bg-card border-2 border-border/50 hover:border-accent/50 hover:shadow-xl text-foreground',
    accent: 'bg-accent/10 border-2 border-accent/40 hover:border-accent hover:shadow-xl text-foreground',
    default: 'bg-card border-2 border-border/30 hover:border-border hover:shadow-lg text-foreground',
  };

  const sizeClasses = {
    default: 'min-h-[200px] p-6',
    lg: 'min-h-[280px] md:min-h-[320px] p-8 md:p-10',
  };

  return (
    <div
      className={cn(
        'card-tactile relative group rounded-2xl cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
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
      <div className="flex flex-col items-center text-center gap-4 mt-3">
        {/* Pictogramme ou Icône */}
        {pictogramSrc ? (
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm p-4 shadow-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <img
              src={pictogramSrc}
              alt={title}
              className="w-full h-full object-contain drop-shadow-md"
              style={{
                mixBlendMode: 'multiply',
                filter: 'contrast(1.1) brightness(0.95)'
              }}
            />
          </div>
        ) : Icon ? (
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm p-4 shadow-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Icon size={56} className="text-primary" strokeWidth={1.5} />
          </div>
        ) : null}

        {/* Titre */}
        <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed px-2">
            {description}
          </p>
        )}
      </div>

      {/* Effet hover */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-ring transition-colors pointer-events-none" />
    </div>
  );
}
