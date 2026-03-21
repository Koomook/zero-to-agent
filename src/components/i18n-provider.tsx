"use client";

import { useState, useEffect } from "react";
import { I18nContext, locales, type Locale } from "@/lib/i18n";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && saved in locales) {
      setLocale(saved);
    }
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  return (
    <I18nContext value={{
      locale,
      setLocale: handleSetLocale,
      t: locales[locale],
    }}>
      {children}
    </I18nContext>
  );
}
