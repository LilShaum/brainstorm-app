import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'brainstorm-dark-mode';

/**
 * Detect system color scheme preference.
 * Returns true if the user prefers dark mode.
 */
function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Read persisted value from localStorage.
 * Returns null if no value stored or on error.
 */
function getStoredPreference(): boolean | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {
    // localStorage unavailable
  }
  return null;
}

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = getStoredPreference();
    return stored !== null ? stored : getSystemPreference();
  });

  // Sync class on <html> and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(isDarkMode));
    } catch {
      // localStorage unavailable
    }
  }, [isDarkMode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly chosen (stored value is null)
      if (getStoredPreference() === null) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setIsDarkMode(value);
  }, []);

  return { isDarkMode, toggleDarkMode, setDarkMode };
}
