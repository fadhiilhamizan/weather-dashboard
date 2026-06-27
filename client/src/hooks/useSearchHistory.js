import { useCallback } from 'react';
import { usePersistentState } from './usePersistentState.js';

const MAX_HISTORY = 5;
const STORAGE_KEY = 'atmosfer:history';

/**
 * Keeps the last few searched locations in localStorage so they survive a
 * refresh and can be clicked to re-load instantly (a "must-have" from the brief).
 * Entries are de-duplicated by coordinates and the most recent is kept first.
 */
export function useSearchHistory() {
  const [history, setHistory] = usePersistentState(STORAGE_KEY, []);

  const add = useCallback(
    (place) => {
      if (!place?.name) return;
      const id = `${place.lat?.toFixed?.(2)},${place.lon?.toFixed?.(2)}`;
      const entry = {
        id,
        name: place.name,
        country: place.country || '',
        state: place.state || '',
        lat: place.lat,
        lon: place.lon,
      };
      setHistory((prev) => {
        const withoutDupe = prev.filter((p) => p.id !== id);
        return [entry, ...withoutDupe].slice(0, MAX_HISTORY);
      });
    },
    [setHistory]
  );

  const remove = useCallback(
    (id) => setHistory((prev) => prev.filter((p) => p.id !== id)),
    [setHistory]
  );

  const clear = useCallback(() => setHistory([]), [setHistory]);

  return { history, add, remove, clear };
}
