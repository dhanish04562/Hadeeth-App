import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Hadeeth } from "@/data/store";

type LangCode = "ar" | "ta" | "en";

type LanguageContextType = {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  getText: (h: Hadeeth) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>("ta");

  const getText = useCallback(
    (h: Hadeeth) => {
      switch (lang) {
        case "ar":
          return h.arabic;
        case "ta":
          return h.tamil || h.english || h.arabic;
        case "en":
          return h.english || h.arabic;
        default:
          return h.arabic;
      }
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, getText }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
