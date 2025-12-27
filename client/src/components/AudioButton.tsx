import { Button, buttonVariants } from './ui/button';
import type { VariantProps } from 'class-variance-authority';
import { useAudioClick } from '../hooks/useAutoPlay';
import { cn } from '../lib/utils';

interface AudioButtonProps extends Omit<React.ComponentProps<'button'>, 'size'>, Omit<VariantProps<typeof buttonVariants>, 'size'> {
  /**
   * Clé de l'audio à jouer au clic
   */
  audioKey: string;
  
  /**
   * Icône à afficher (pictogramme)
   */
  icon?: React.ReactNode;
  
  /**
   * Texte du bouton (optionnel, peut être masqué en mode pictogramme seul)
   */
  children?: React.ReactNode;
  
  /**
   * Mode pictogramme seul (masque le texte)
   */
  iconOnly?: boolean;
  
  /**
   * Taille du bouton (xl est custom pour AudioButton)
   */
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg' | 'xl';
}

/**
 * Bouton avec feedback audio automatique
 * 
 * Joue un audio en Dioula quand on clique dessus
 * Conçu pour l'interface 100% vocale
 * 
 * @example
 * ```tsx
 * <AudioButton 
 *   audioKey="button.sell"
 *   icon={<ShoppingCart className="w-8 h-8" />}
 *   size="xl"
 *   onClick={handleSell}
 * >
 *   Vendre
 * </AudioButton>
 * ```
 */
export function AudioButton({
  audioKey,
  icon,
  children,
  iconOnly = false,
  size = 'default',
  className,
  onClick,
  ...props
}: AudioButtonProps) {
  const playAudio = useAudioClick(audioKey);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Jouer l'audio
    playAudio();
    
    // Appeler le onClick original
    onClick?.(e);
  };

  return (
    <Button
      size={size === 'xl' ? 'default' : size}
      className={cn(
        'relative',
        // Boutons extra larges pour tactile
        size === 'xl' && 'h-20 px-8 text-lg',
        // Animation au clic
        'active:scale-95 transition-transform',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {icon && (
        <span className={cn('flex items-center justify-center', !iconOnly && children && 'mr-3')}>
          {icon}
        </span>
      )}
      {!iconOnly && children && (
        <span className="flex-1">{children}</span>
      )}
      {iconOnly && (
        <span className="sr-only">{children}</span>
      )}
    </Button>
  );
}
