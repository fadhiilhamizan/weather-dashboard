import { config } from '../config.js';
import { cache } from '../services/cache.service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  geocode,
  reverseGeocode,
  getWeatherByCoords,
  getWeatherByCity,
} from '../services/weather.service.js';

const VALID_UNITS = new Set(['metric', 'imperial']);

function parseUnits(raw) {
  const u = (raw || 'metric').toLowerCase();
  if (!VALID_UNITS.has(u)) {
    throw AppError.badRequest("units must be 'metric' or 'imperial'.", 'INVALID_UNITS');
  }
  return u;
}

function parseCoord(raw, name) {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) {
    throw AppError.badRequest(`${name} must be a number.`, 'INVALID_COORDS');
  }
  return n;
}

// Round coords for the cache key so "essentially the same spot" shares a cache
// entry (and we don't store a separate copy per GPS jitter).
const coordKey = (lat, lon) => `${lat.toFixed(3)},${lon.toFixed(3)}`;

/** GET /api/weather?lat=&lon=&units= */
export const getByCoords = asyncHandler(async (req, res) => {
  const lat = parseCoord(req.query.lat, 'lat');
  const lon = parseCoord(req.query.lon, 'lon');
  const units = parseUnits(req.query.units);

  const cacheKey = `weather:${coordKey(lat, lon)}:${units}`;
  const { value, cached } = await cache.wrap(cacheKey, config.cache.weatherTtl, () =>
    getWeatherByCoords({ lat, lon, units })
  );

  res.set('X-Cache', cached ? 'HIT' : 'MISS');
  res.set('X-Demo-Mode', String(value.demo));
  res.json(value.data);
});

/** GET /api/weather/city?q=&units= */
export const getByCity = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) throw AppError.badRequest('Query parameter q (city name) is required.', 'MISSING_QUERY');
  const units = parseUnits(req.query.units);

  const cacheKey = `weather:city:${q.toLowerCase()}:${units}`;
  const { value, cached } = await cache.wrap(cacheKey, config.cache.weatherTtl, () =>
    getWeatherByCity({ query: q, units })
  );

  res.set('X-Cache', cached ? 'HIT' : 'MISS');
  res.set('X-Demo-Mode', String(value.demo));
  res.json(value.data);
});

/** GET /api/geocode?q=&limit=  — city autocomplete. */
export const getGeocode = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 5, 1), 10);

  const cacheKey = `geo:${q.toLowerCase()}:${limit}`;
  const { value, cached } = await cache.wrap(cacheKey, config.cache.geocodeTtl, () =>
    geocode(q, limit)
  );

  res.set('X-Cache', cached ? 'HIT' : 'MISS');
  res.json(value);
});

/** GET /api/reverse?lat=&lon=  — coords to place name. */
export const getReverse = asyncHandler(async (req, res) => {
  const lat = parseCoord(req.query.lat, 'lat');
  const lon = parseCoord(req.query.lon, 'lon');

  const cacheKey = `revgeo:${coordKey(lat, lon)}`;
  const { value, cached } = await cache.wrap(cacheKey, config.cache.geocodeTtl, () =>
    reverseGeocode(lat, lon)
  );

  res.set('X-Cache', cached ? 'HIT' : 'MISS');
  res.json(value);
});
