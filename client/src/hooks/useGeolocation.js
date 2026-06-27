import { useCallback, useState } from 'react';

/**
 * Thin wrapper over the browser Geolocation API. Returns a `locate()` that
 * resolves to { lat, lon }, plus loading/error state for the UI. All the
 * permission/timeout edge cases are translated into a friendly message.
 */
export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const locate = useCallback(() => {
    setError(null);
    if (!('geolocation' in navigator)) {
      const message = 'Geolocation is not supported by this browser.';
      setError(message);
      return Promise.reject(new Error(message));
    }

    setLoading(true);
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoading(false);
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          setLoading(false);
          const message =
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied. Search for a city instead.'
              : 'Could not get your location. Try searching for a city.';
          setError(message);
          reject(new Error(message));
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
      );
    });
  }, []);

  return { locate, loading, error };
}
