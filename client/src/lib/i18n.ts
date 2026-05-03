import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸", nativeName: "English" },
  { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳", nativeName: "中文" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language detection order: localStorage → browser language → fallback
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "yfit_language",
      caches: ["localStorage"],
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    // Start with empty resources — filled by fetch() calls below
    resources: {},
    load: "languageOnly",
    ns: ["translation"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Don't suspend while loading — show English until translation loads
    react: {
      useSuspense: false,
    },
  });

// Dynamically load translation files
SUPPORTED_LANGUAGES.forEach(({ code }) => {
  fetch(`/locales/${code}/translation.json`)
    .then((res) => res.json())
    .then((data) => {
      i18n.addResourceBundle(code, "translation", data, true, true);
    })
    .catch(() => {
      // Silently fall back to English if a language file fails to load
    });
});

export default i18n;
