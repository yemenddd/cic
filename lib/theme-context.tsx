'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Light or dark, and who decided.
 *
 * `mode` is the preference: `system` means "whatever this device is set to",
 * and it is the default. `theme` is what that resolves to right now, and it is
 * what every component reads — so nothing outside this file has to know the
 * difference between "dark because the OS is dark" and "dark because somebody
 * chose it".
 *
 * The site used to open dark for everybody regardless, and only went light if
 * a visitor had explicitly asked for it. On a phone in daylight with the OS in
 * light mode that is a page that ignores what its owner already told their
 * device.
 */

export type Theme = 'dark' | 'light';
export type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeCtx {
  /** What is actually on screen. */
  theme: Theme;
  /** Where that came from. */
  mode: ThemeMode;
  /** Light ↔ dark, as an explicit choice. */
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const THEME_STORAGE_KEY = 'cic-theme';
/** The key this used to use. Renaming the brand must not reset anyone's choice. */
export const LEGACY_THEME_STORAGE_KEY = 'cict-theme';

const Ctx = createContext<ThemeCtx>({
  theme: 'dark',
  mode: 'system',
  toggle: () => {},
  setMode: () => {},
});

function readMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
      ?? localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  } catch {
    // Private windows and blocked site data both throw here. An unreadable
    // preference is the same as no preference, not a crash.
    return 'system';
  }
}

function systemTheme(): Theme {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // These two are only what the server can guess. The blocking script in
  // app/layout.tsx has already stamped the right answer on <html>; until the
  // effect below has read the stored preference, `read` is false and nothing
  // here touches the DOM — otherwise the default would paint over a choice the
  // visitor actually made.
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<Theme>('dark');
  const [read, setRead] = useState(false);

  useEffect(() => {
    const initial = readMode();
    setModeState(initial);
    setTheme(initial === 'system' ? systemTheme() : initial);
    setRead(true);
  }, []);

  // One place writes the attribute, and it is downstream of the resolved theme.
  // Anything that wants to change what is on screen changes state and stops.
  useEffect(() => {
    if (read) apply(theme);
  }, [read, theme]);

  // While following the system, follow it live: somebody whose phone switches
  // to dark at sunset should not have to reload the page.
  useEffect(() => {
    if (!read || mode !== 'system' || typeof window === 'undefined') return;

    const query = window.matchMedia('(prefers-color-scheme: light)');
    const sync = () => setTheme(query.matches ? 'light' : 'dark');

    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, [read, mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setTheme(next === 'system' ? systemTheme() : next);

    try {
      // 'system' is stored rather than cleared, so "follow the device" is a
      // remembered decision and not merely the absence of one.
      localStorage.setItem(THEME_STORAGE_KEY, next);
      localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    } catch {
      // Unwritable storage costs the preference on the next visit and nothing
      // else; the page in front of them has already changed.
    }
  }, []);

  // Light ↔ dark. Deliberately not a three-way cycle: this is the small pill in
  // the header, and a control whose next state cannot be predicted from its
  // current one is worse than one that cannot reach every state. Getting back
  // to "follow the device" is a labelled row in the panels, where there is room
  // to say so.
  const toggle = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setMode]);

  return (
    <Ctx.Provider value={{ theme, mode, toggle, setMode }}>{children}</Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
