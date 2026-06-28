import { AppError } from './AppError.js';

/**
 * fetch() with a timeout so a slow upstream can't hang our request forever.
 * Shared by every provider service (OpenWeather, Open-Meteo, keyless reverse
 * geocoding) so timeout + error-mapping behaviour stays consistent.
 */
export async function fetchJson(url, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 401) {
      throw AppError.upstream('Weather provider rejected the API key.', 'BAD_API_KEY');
    }
    if (res.status === 429) {
      throw AppError.upstream('Weather provider quota exceeded. Try again later.', 'UPSTREAM_RATE_LIMIT');
    }
    if (!res.ok) {
      throw AppError.upstream(`Weather provider responded with ${res.status}.`, 'UPSTREAM_ERROR');
    }
    return await res.json();
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.name === 'AbortError') {
      throw AppError.upstream('Weather provider timed out.', 'UPSTREAM_TIMEOUT');
    }
    throw AppError.upstream('Could not reach the weather provider.', 'UPSTREAM_UNREACHABLE');
  } finally {
    clearTimeout(timer);
  }
}
