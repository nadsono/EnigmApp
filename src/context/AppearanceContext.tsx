import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useEnigma } from './EnigmaContext.tsx';
import {
  appearanceStorageKey,
  DEFAULT_APPEARANCE,
  normalizeAppearancePreferences,
  parseAppearancePreferences,
  serializeAppearancePreferences,
  type AppearancePreferences,
} from '../domain/uiTheme.ts';

type ResolvedTheme = 'light' | 'dark';

interface AppearanceContextValue {
  preferences: AppearancePreferences;
  resolvedTheme: ResolvedTheme;
  persistenceWarning: boolean;
  setPreferences: (patch: Partial<AppearancePreferences>) => void;
  resetPreferences: () => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);
// Retains this session's choices when browser storage is unavailable, separated by identity.
const sessionPreferences = new Map<string, AppearancePreferences>();
const volatileScopes = new Set<string>();

function loadPreferences(storageKey: string): AppearancePreferences {
  if (volatileScopes.has(storageKey)) return sessionPreferences.get(storageKey) ?? { ...DEFAULT_APPEARANCE };
  try {
    const stored = window.localStorage.getItem(storageKey);
    return parseAppearancePreferences(stored);
  } catch {
    // Private browsing or quota restrictions must not prevent local customization.
  }
  return sessionPreferences.get(storageKey) ?? { ...DEFAULT_APPEARANCE };
}

function systemTheme(): ResolvedTheme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

const UserAppearanceProvider: React.FC<React.PropsWithChildren<{ storageKey: string }>> = ({ children, storageKey }) => {
  const [preferences, setPreferencesState] = useState(() => loadPreferences(storageKey));
  const preferencesRef = useRef(preferences);
  const [preferredSystemTheme, setPreferredSystemTheme] = useState(systemTheme);
  const [persistenceWarning, setPersistenceWarning] = useState(() => {
    try { window.localStorage.getItem(storageKey); return false; } catch { return true; }
  });
  const resolvedTheme = preferences.theme === 'system' ? preferredSystemTheme : preferences.theme;

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setPreferredSystemTheme(media.matches ? 'dark' : 'light');
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const receivePreferences = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      const next = parseAppearancePreferences(event.key === null ? null : event.newValue);
      volatileScopes.delete(storageKey);
      sessionPreferences.set(storageKey, next);
      preferencesRef.current = next;
      setPreferencesState(next);
    };
    window.addEventListener('storage', receivePreferences);
    return () => window.removeEventListener('storage', receivePreferences);
  }, [storageKey]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.density = preferences.density;
    root.dataset.houseColors = preferences.houseColors;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, preferences.density, preferences.houseColors]);

  const setPreferences = useCallback((patch: Partial<AppearancePreferences>) => {
    const next = normalizeAppearancePreferences({ ...preferencesRef.current, ...patch });
    preferencesRef.current = next;
    sessionPreferences.set(storageKey, next);
    setPreferencesState(next);
    // Write only in response to this identity's action; no effect can write old values after login.
    try {
      window.localStorage.setItem(storageKey, serializeAppearancePreferences(next));
      volatileScopes.delete(storageKey);
      setPersistenceWarning(false);
    } catch {
      volatileScopes.add(storageKey);
      setPersistenceWarning(true);
      // The in-memory choice remains usable for the duration of this session.
    }
  }, [storageKey]);

  const resetPreferences = useCallback(() => setPreferences({ ...DEFAULT_APPEARANCE }), [setPreferences]);
  const value = useMemo(() => ({ preferences, resolvedTheme, persistenceWarning, setPreferences, resetPreferences }),
    [preferences, resolvedTheme, persistenceWarning, setPreferences, resetPreferences]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
};

export const AppearanceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { currentUser, isAuthenticated } = useEnigma();
  const storageKey = appearanceStorageKey(isAuthenticated ? currentUser.id : null);
  // A new identity gets a fresh state before rendering its workspace; anonymous choices stay separate.
  return <UserAppearanceProvider key={storageKey} storageKey={storageKey}>{children}</UserAppearanceProvider>;
};

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance deve ser usado dentro de AppearanceProvider.');
  return context;
}
