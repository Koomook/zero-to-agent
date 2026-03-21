"use client";

import { createContext, useContext } from "react";
import en, { type Translations } from "./en";
import ja from "./ja";
import ko from "./ko";

export type Locale = "en" | "ja" | "ko";

export const locales: Record<Locale, Translations> = { en, ja, ko };

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  ko: "한국어",
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

export function useI18n() {
  return useContext(I18nContext);
}
