import { useCallback } from 'react';
import { usePersistentState } from './usePersistentState.js';

const MAX_FAVORITES = 12;
const STORAGE_KEY = 'atmosfer:favorites';

/** Stable id for a place, rounded so "the same spot" de-duplicates. */
export const placeId = (place) =>
  `${place.lat?.toFixed?.(2)},${place.lon?.toFixed?.(2)}`;

/**
 * Saved/favourite locations, persisted to localStorage. Unlike search history
 * (which is automatic and capped at the last few), favourites are explicit:
 * the user stars a place to pin it, and can remove it. Clicking one re-loads
 * its weather without searching again.
 */
export function useFavorites() {
  const [favorites, setFavorites] = usePersistentState(STORAGE_KEY, []);

  const has = useCallback(
    (id) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const add = useCallback(
    (place) => {
      if (!place?.name) return;
      const id = placeId(place);
      const entry = {
        id,
        name: place.name,
        country: place.country || '',
        state: place.state || '',
        lat: place.lat,
        lon: place.lon,
      };
      setFavorites((prev) => {
        if (prev.some((p) => p.id === id)) return prev;
        return [...prev, entry].slice(0, MAX_FAVORITES);
      });
    },
    [setFavorites]
  );

  const remove = useCallback(
    (id) => setFavorites((prev) => prev.filter((p) => p.id !== id)),
    [setFavorites]
  );

  const toggle = useCallback(
    (place) => {
      const id = placeId(place);
      if (favorites.some((f) => f.id === id)) remove(id);
      else add(place);
    },
    [favorites, add, remove]
  );

  return { favorites, add, remove, toggle, has };
}
