import { Languages } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupportedLanguage } from '@/lib/audioManager';

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'dioula', label: 'Dioula', flag: '🇨🇮' },
  { code: 'baule', label: 'Baoulé', flag: '🇨🇮' },
  { code: 'bete', label: 'Bété', flag: '🇨🇮' },
  { code: 'senoufo', label: 'Sénoufo', flag: '🇨🇮' },
  { code: 'malinke', label: 'Malinké', flag: '🇨🇮' },
];

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const { speak } = useSpeech();

  const currentLanguage = LANGUAGES.find((lang) => lang.code === language) || LANGUAGES[0];

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    
    // Annonce vocale du changement de langue
    setTimeout(() => {
      speak(t('languageChanged'), { lang: newLanguage === 'dioula' ? 'fr' : 'fr-FR' });
    }, 100);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg" className="gap-3">
          <Languages className="w-6 h-6" />
          <span className="text-2xl">{currentLanguage.flag}</span>
          <span>{currentLanguage.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`text-lg py-3 cursor-pointer ${
              language === lang.code ? 'bg-accent' : ''
            }`}
          >
            <span className="text-2xl mr-3">{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
