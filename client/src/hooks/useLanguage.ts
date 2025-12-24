import { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage } from '@/lib/audioManager';
import { translations, Translations } from '@/lib/translations';

const LANGUAGE_STORAGE_KEY = 'ifn-language';
const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';

/**
 * Hook pour gérer la langue de l'interface et des annonces vocales
 * Support de 6 langues : Français, Dioula, Baoulé, Bété, Sénoufo, Malinké
 */
export function useLanguage() {
  // État de la langue courante
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    // Charger la langue sauvegardée depuis localStorage
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (saved as SupportedLanguage) || DEFAULT_LANGUAGE;
  });

  // Sauvegarder la langue dans localStorage quand elle change
  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  // Fonction pour changer de langue
  const setLanguage = useCallback((newLanguage: SupportedLanguage) => {
    setLanguageState(newLanguage);
  }, []);

  // Fonction pour obtenir une traduction
  const t = useCallback(
    (key: keyof Translations): string => {
      return translations[language]?.[key] || translations.fr[key] || key;
    },
    [language]
  );

  // Fonction pour obtenir toutes les traductions
  const getTranslations = useCallback((): Translations => {
    return translations[language] || translations.fr;
  }, [language]);

  // Fonction pour formater un message de vente
  const getSaleMessage = useCallback(
    (amount: number): string => {
      const t = translations[language];
      const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);
      return `${t.saleRecorded}. ${formattedAmount} ${t.francsCFA}`;
    },
    [language]
  );

  // Fonction pour formater un message d'expiration CNPS/CMU
  const getExpirationMessage = useCallback(
    (type: 'cnps' | 'cmu', daysLeft: number): string => {
      const t = translations[language];
      const message = type === 'cnps' ? t.yourCNPSExpiresIn : t.yourCMUExpiresIn;
      return `${t.attention}. ${message} ${daysLeft} ${t.days}`;
    },
    [language]
  );

  // Fonction pour formater un message de badge débloqué
  const getBadgeUnlockedMessage = useCallback(
    (badgeName: string): string => {
      const t = translations[language];
      return `${t.congratulations}. ${t.youUnlockedBadge} ${badgeName}`;
    },
    [language]
  );

  return {
    language,
    setLanguage,
    t,
    getTranslations,
    getSaleMessage,
    getExpirationMessage,
    getBadgeUnlockedMessage,
  };
}
