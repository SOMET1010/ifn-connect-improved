import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type Language, type Translations } from '@/lib/nouchiTranslations';

interface NouchiStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

export const useNouchi = create<NouchiStore>()(
  persist(
    (set) => ({
      language: 'nouchi', // Par défaut en Nouchi pour le terrain
      t: translations.nouchi,
      setLanguage: (lang: Language) =>
        set({
          language: lang,
          t: translations[lang],
        }),
    }),
    {
      name: 'ifn-language-storage',
    }
  )
);
