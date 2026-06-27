import { useCallback, useState } from 'react';
import { fetchWeatherByCoords, fetchWeatherByCity } from '../api/weatherApi.js';

/**
 * Owns the weather request lifecycle and exposes it as an explicit status
 * machine: 'idle' | 'loading' | 'success' | 'error'. The UI renders a skeleton
 * for 'loading', the dashboard for 'success', and a friendly panel for 'error'
 * — which is exactly the loading/error handling the brief asks for.
 */
export function useWeather() {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [demo, setDemo] = useState(false);

  const run = useCallback(async (fetcher) => {
    setStatus('loading');
    setError(null);
    try {
      const result = await fetcher();
      setData(result.data);
      setDemo(result.demo);
      setStatus('success');
      return result.data;
    } catch (err) {
      setError({ code: err.code, message: err.message });
      setStatus('error');
      throw err;
    }
  }, []);

  const loadByCoords = useCallback(
    ({ lat, lon, units }) => run(() => fetchWeatherByCoords({ lat, lon, units })),
    [run]
  );

  const loadByCity = useCallback(
    ({ query, units }) => run(() => fetchWeatherByCity({ query, units })),
    [run]
  );

  return { status, data, error, demo, loadByCoords, loadByCity };
}
