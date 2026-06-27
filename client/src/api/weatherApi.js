/**
 * The single place the frontend talks to the backend. The frontend NEVER calls
 * OpenWeather directly — it only knows about our proxy, which holds the key.
 *
 * In dev, BASE is '' and Vite proxies /api to :5050. In prod, set
 * VITE_API_BASE_URL to the deployed API origin.
 */
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`);
  } catch {
    // Network-level failure (offline, DNS, server down).
    throw new ApiError('NETWORK', "Can't reach the server. Check your connection and try again.");
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* some responses (or failures) may not be JSON */
  }

  if (!res.ok) {
    const code = body?.error?.code || `HTTP_${res.status}`;
    const message = body?.error?.message || 'Something went wrong. Please try again.';
    throw new ApiError(code, message);
  }

  return {
    data: body,
    demo: res.headers.get('X-Demo-Mode') === 'true',
    cache: res.headers.get('X-Cache'),
  };
}

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

const u = encodeURIComponent;

export const fetchWeatherByCoords = ({ lat, lon, units }) =>
  request(`/api/weather?lat=${lat}&lon=${lon}&units=${units}`);

export const fetchWeatherByCity = ({ query, units }) =>
  request(`/api/weather/city?q=${u(query)}&units=${units}`);

export const searchCities = (query) => request(`/api/geocode?q=${u(query)}&limit=6`);

export const reverseGeocode = ({ lat, lon }) => request(`/api/reverse?lat=${lat}&lon=${lon}`);

export const fetchHealth = () => request('/api/health');
