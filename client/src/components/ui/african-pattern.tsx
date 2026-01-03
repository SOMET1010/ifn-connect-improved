interface AfricanPatternProps {
  variant?: 'wax' | 'geometric' | 'kente';
  opacity?: number;
  className?: string;
}

export function AfricanPattern({ variant = 'wax', opacity = 0.1, className = '' }: AfricanPatternProps) {
  const patterns = {
    wax: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="wax-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="8" fill="currentColor" opacity={opacity} />
            <circle cx="60" cy="40" r="12" fill="currentColor" opacity={opacity * 0.7} />
            <circle cx="100" cy="20" r="6" fill="currentColor" opacity={opacity} />
            <circle cx="40" cy="80" r="10" fill="currentColor" opacity={opacity * 0.8} />
            <circle cx="80" cy="100" r="7" fill="currentColor" opacity={opacity} />
            <path d="M 10 60 Q 30 50 50 60 T 90 60" stroke="currentColor" strokeWidth="2" fill="none" opacity={opacity * 0.6} />
            <path d="M 20 100 Q 40 90 60 100" stroke="currentColor" strokeWidth="1.5" fill="none" opacity={opacity * 0.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wax-pattern)" />
      </svg>
    ),
    geometric: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="geometric-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect x="10" y="10" width="20" height="20" fill="currentColor" opacity={opacity} transform="rotate(45 20 20)" />
            <rect x="50" y="10" width="15" height="15" fill="currentColor" opacity={opacity * 0.8} />
            <rect x="10" y="50" width="15" height="15" fill="currentColor" opacity={opacity * 0.7} />
            <rect x="50" y="50" width="20" height="20" fill="currentColor" opacity={opacity} transform="rotate(45 60 60)" />
            <line x1="0" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1" opacity={opacity * 0.5} />
            <line x1="40" y1="0" x2="40" y2="80" stroke="currentColor" strokeWidth="1" opacity={opacity * 0.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
      </svg>
    ),
    kente: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="kente-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="100" height="20" fill="currentColor" opacity={opacity * 0.8} />
            <rect x="0" y="30" width="100" height="10" fill="currentColor" opacity={opacity * 0.5} />
            <rect x="0" y="50" width="100" height="20" fill="currentColor" opacity={opacity * 0.8} />
            <rect x="0" y="80" width="100" height="10" fill="currentColor" opacity={opacity * 0.5} />
            <rect x="20" y="0" width="10" height="100" fill="currentColor" opacity={opacity * 0.6} />
            <rect x="50" y="0" width="15" height="100" fill="currentColor" opacity={opacity * 0.7} />
            <rect x="80" y="0" width="8" height="100" fill="currentColor" opacity={opacity * 0.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#kente-pattern)" />
      </svg>
    ),
  };

  return patterns[variant];
}
