import { ShoppingCart, Package, Wallet, HelpCircle, LucideIcon } from 'lucide-react';
import { audioManager } from '@/lib/audioManager';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  audioKey: string;
  badge?: number;
}

interface MobileNavigationProps {
  activeItem: string;
  onItemClick: (itemId: string) => void;
  items?: NavItem[];
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'sell',
    label: 'Vendre',
    icon: ShoppingCart,
    audioKey: 'sell',
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: Package,
    audioKey: 'stock',
  },
  {
    id: 'money',
    label: 'Argent',
    icon: Wallet,
    audioKey: 'money',
  },
  {
    id: 'help',
    label: 'Aide',
    icon: HelpCircle,
    audioKey: 'help',
  },
];

/**
 * Navigation mobile fixe en bas d'écran
 * 4 actions principales avec pictogrammes et feedback audio
 */
export default function MobileNavigation({
  activeItem,
  onItemClick,
  items = DEFAULT_NAV_ITEMS,
}: MobileNavigationProps) {
  const handleItemClick = (item: NavItem) => {
    audioManager.provideFeedback('tap');
    audioManager.playInstruction(item.audioKey);
    onItemClick(item.id);
  };

  return (
    <nav className="mobile-nav" aria-label="Navigation principale">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;

        return (
          <button
            key={item.id}
            className={cn(
              'mobile-nav-item',
              isActive && 'active'
            )}
            onClick={() => handleItemClick(item)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Badge de notification */}
            {item.badge && item.badge > 0 && (
              <div className="notification-badge">
                {item.badge > 99 ? '99+' : item.badge}
              </div>
            )}

            {/* Icône */}
            <Icon size={32} strokeWidth={2.5} />

            {/* Label */}
            <span className="text-xs font-semibold mt-1">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
