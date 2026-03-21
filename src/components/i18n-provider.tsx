"use client";

import { useSyncExternalStore } from "react";
import { I18nContext, locales, type Locale } from "@/lib/i18n";

const DEFAULT_LOCALE: Locale = "en";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("localechange", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("localechange", callback);
  };
}

function getLocaleSnapshot(): Locale {
  const saved = localStorage.getItem("locale");
  return saved && saved in locales ? (saved as Locale) : DEFAULT_LOCALE;
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getLocaleSnapshot,
    () => DEFAULT_LOCALE,
  );

  const handleSetLocale = (newLocale: Locale) => {
    localStorage.setItem("locale", newLocale);
    window.dispatchEvent(new Event("localechange"));
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
