import dotenv from 'dotenv';

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const apiKey = (process.env.OPENWEATHER_API_KEY || '').trim();

// Provider selection:
//   - WEATHER_PROVIDER explicitly forces 'openmeteo' | 'openweather' | 'demo'.
//   - Otherwise: 'openweather' if a key is set, else 'openmeteo'.
// Open-Meteo needs no key and no quota, so the app now has real live weather
// with zero setup; demo mode is only a deliberate, last-resort fallback.
const providerOverride = (process.env.WEATHER_PROVIDER || '').trim().toLowerCase();
const VALID_PROVIDERS = new Set(['openmeteo', 'openweather', 'demo']);
const provider = VALID_PROVIDERS.has(providerOverride)
  ? providerOverride
  : apiKey.length > 0
    ? 'openweather'
    : 'openmeteo';

export const config = {
  port: toInt(process.env.PORT, 5050),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  weather: {
    apiKey,
    provider,
    // Demo mode now only when explicitly requested (or no key AND open-meteo
    // somehow unavailable). Kept for the zero-network reviewer path.
    demoMode: provider === 'demo',

    // OpenWeather endpoints (used when provider === 'openweather').
    baseUrl: 'https://api.openweathermap.org/data/3.0/onecall',
    geoUrl: 'https://api.openweathermap.org/geo/1.0/direct',
    reverseGeoUrl: 'https://api.openweathermap.org/geo/1.0/reverse',
    airUrl: 'https://api.openweathermap.org/data/2.5/air_pollution',

    // Open-Meteo endpoints (used when provider === 'openmeteo'). No key needed.
    openMeteo: {
      forecastUrl: 'https://api.open-meteo.com/v1/forecast',
      geoUrl: 'https://geocoding-api.open-meteo.com/v1/search',
      airUrl: 'https://air-quality-api.open-meteo.com/v1/air-quality',
      // Keyless reverse geocoding (coords -> place name) for the GPS button.
      reverseUrl: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
    },
  },

  cache: {
    weatherTtl: toInt(process.env.CACHE_TTL_SECONDS, 900),
    geocodeTtl: toInt(process.env.GEOCODE_CACHE_TTL_SECONDS, 86400),
  },

  rateLimit: {
    windowSeconds: toInt(process.env.RATE_LIMIT_WINDOW_SECONDS, 60),
    maxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 60),
  },

  isProduction: process.env.NODE_ENV === 'production',
};
