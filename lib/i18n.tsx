'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { dict, type Lang } from './dictionary';

type Ctx = {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** Resolve a dotted key path, e.g. t('nav.home'). Returns the key if missing. */
  t: (key: string) => string;
  /** Resolve any value (arrays/objects) for data-driven sections, e.g. tx('program.streams'). */
  tx: <T = unknown>(key: string) => T;
};

const LangContext = createContext<Ctx | null>(null);

function resolve(lang: Lang, key: string): unknown {
  const parts = key.split('.');
  let value: unknown = dict[lang];
  for (const p of parts) {
    if (value && typeof value === 'object' && p in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return value;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Arabic is the official / default language
  const [lang, setLangState] = useState<Lang>('ar');

  useEffect(() => {
    // Reads the previous key too — see the note in lib/theme-context.tsx.
    const saved = (typeof window !== 'undefined' &&
      (localStorage.getItem('cic-lang') ?? localStorage.getItem('cict-lang'))) as Lang | null;
    if (saved === 'ar' || saved === 'en' || saved === 'tr') setLangState(saved);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('cic-lang', lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const t = (key: string): string => {
    const v = resolve(lang, key);
    return typeof v === 'string' ? v : key;
  };

  const tx = <T,>(key: string): T => resolve(lang, key) as T;

  const value: Ctx = {
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    setLang: setLangState,
    toggle: () => setLangState((l) => (l === 'tr' ? 'en' : l === 'en' ? 'ar' : 'tr')),
    t,
    tx,
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within <LanguageProvider>');
  return ctx;
}
