import { useCallback, useEffect, useState } from 'react';

/**
 * useState that persists to localStorage. Used for the unit preference and the
 * search history. Guards against environments where localStorage is unavailable
 * (private mode quota errors, SSR) so it never throws.
 */
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked — fail silently, state still works in memory */
    }
  }, [key, value]);

  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return [value, setValue, reset];
}
