import { useEffect, useState } from 'react';
import { fetchWeatherByCoords } from '../api/weatherApi.js';

/**
 * Fetches weather for several locations at once (the saved favourites) for the
 * comparison view. Requests run in parallel; the server already caches per
 * coordinate, so re-opening Compare is cheap. Each result is independent —
 * one city failing doesn't sink the others.
 */
export function useMultiWeather(places, units) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Re-run when the set of places or the units change.
  const key = places.map((p) => p.id).join('|') + ':' + units;

  useEffect(() => {
    if (!places.length) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);

    Promise.allSettled(
      places.map((p) => fetchWeatherByCoords({ lat: p.lat, lon: p.lon, units }))
    ).then((settled) => {
      if (cancelled) return;
      setResults(
        settled.map((r, i) => ({
          place: places[i],
          status: r.status === 'fulfilled' ? 'success' : 'error',
          data: r.status === 'fulfilled' ? r.value.data : null,
          error: r.status === 'rejected' ? r.reason : null,
        }))
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { results, loading };
}
