import dotenv from 'dotenv';

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const apiKey = (process.env.OPENWEATHER_API_KEY || '').trim();

export const config = {
  port: toInt(process.env.PORT, 5050),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  weather: {
    apiKey,
    // When no key is configured we serve mock data instead of crashing.
    // This keeps the dashboard runnable for reviewers with zero setup.
    demoMode: apiKey.length === 0,
    baseUrl: 'https://api.openweathermap.org/data/3.0/onecall',
    geoUrl: 'https://api.openweathermap.org/geo/1.0/direct',
    reverseGeoUrl: 'https://api.openweathermap.org/geo/1.0/reverse',
    airUrl: 'https://api.openweathermap.org/data/2.5/air_pollution',
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
