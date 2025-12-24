import { Languages } from 'lucide-react';
import { useState, useEffect } from 'react';
import { audioManager, SupportedLanguage } from '@/lib/audioManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'dioula', name: 'Dioula', flag: '🇨🇮' },
  { code: 'baule', name: 'Baoulé', flag: '🇨🇮' },
  { code: 'bete', name: 'Bété', flag: '🇨🇮' },
  { code: 'senoufo', name: 'Sénoufo', flag: '🇨🇮' },
  { code: 'malinke', name: 'Malinké', flag: '🇨🇮' },
];

interface LanguageSelectorProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showLabel?: boolean;
}

/**
 * Sélecteur de langue avec support de 6 langues
 * Change automatiquement la langue de l'interface et de la synthèse vocale
 */
export default function LanguageSelector({
  variant = 'outline',
  size = 'default',
  showLabel = false,
}: LanguageSelectorProps) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('fr');

  useEffect(() => {
    const savedLanguage = audioManager.getLanguage();
    setCurrentLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    audioManager.setLanguage(language);
    audioManager.provideFeedback('success');
    
    // Annoncer le changement de langue
    audioManager.speak(`Langue changée en ${LANGUAGES.find(l => l.code === language)?.name}`);
    
    // Recharger la page pour appliquer les traductions
    window.location.reload();
  };

  const currentLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="text-lg">{currentLang.flag}</span>
          {showLabel && <span>{currentLang.name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`gap-3 cursor-pointer ${
              currentLanguage === lang.code ? 'bg-accent' : ''
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {currentLanguage === lang.code && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
