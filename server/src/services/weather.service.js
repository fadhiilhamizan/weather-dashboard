import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';
import { fetchJson } from '../utils/fetchJson.js';
import { normaliseWeather, normaliseAirQuality } from '../utils/transform.js';
import {
  buildMockWeather,
  mockGeocode,
  mockReverseGeocode,
} from './mock.service.js';

const { weather } = config;

const key = () => weather.apiKey;

/**
 * Turn a city name into a list of candidate locations (used for autocomplete
 * and to resolve a search into coordinates).
 */
export async function geocode(query, limit = 5) {
  if (!query || !query.trim()) return [];
  if (weather.demoMode) return mockGeocode(query, limit);

  const url = `${weather.geoUrl}?q=${encodeURIComponent(query)}&limit=${limit}&appid=${key()}`;
  const data = await fetchJson(url);
  return (data || []).map((c) => ({
    name: c.name,
    country: c.country,
    state: c.state || '',
    lat: c.lat,
    lon: c.lon,
  }));
}

/** Coordinates -> nearest place name (used after browser geolocation). */
export async function reverseGeocode(lat, lon) {
  if (weather.demoMode) return mockReverseGeocode(lat, lon);

  const url = `${weather.reverseGeoUrl}?lat=${lat}&lon=${lon}&limit=1&appid=${key()}`;
  const data = await fetchJson(url);
  return (data || []).map((c) => ({
    name: c.name,
    country: c.country,
    state: c.state || '',
    lat: c.lat,
    lon: c.lon,
  }));
}

/** Air quality is a separate (free-tier) endpoint; failures are non-fatal. */
async function getAirQuality(lat, lon) {
  try {
    const url = `${weather.airUrl}?lat=${lat}&lon=${lon}&appid=${key()}`;
    const data = await fetchJson(url, { timeoutMs: 5000 });
    return normaliseAirQuality(data);
  } catch {
    return null; // AQI is a nice-to-have, never break the main response over it.
  }
}

/**
 * The main entry point: given coordinates (+ optional resolved place name),
 * return a fully normalised weather payload.
 */
export async function getWeatherByCoords({ lat, lon, units = 'metric', place = null }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw AppError.badRequest('Valid lat and lon are required.', 'INVALID_COORDS');
  }

  if (weather.demoMode) {
    const { raw, air } = buildMockWeather({ lat, lon });
    const resolved = place || mockReverseGeocode(lat, lon)[0] || null;
    return { data: normaliseWeather(raw, resolved, units, normaliseAirQuality(air)), demo: true };
  }

  const url =
    `${weather.baseUrl}?lat=${lat}&lon=${lon}` +
    `&units=${units}&exclude=minutely&appid=${key()}`;

  // Fetch forecast and air quality in parallel.
  const [raw, air] = await Promise.all([fetchJson(url), getAirQuality(lat, lon)]);

  // If the caller didn't already know the place name, resolve it.
  let resolved = place;
  if (!resolved) {
    const places = await reverseGeocode(lat, lon).catch(() => []);
    resolved = places[0] || null;
  }

  return { data: normaliseWeather(raw, resolved, units, air), demo: false };
}

/** Convenience: resolve a city name then fetch its weather. */
export async function getWeatherByCity({ query, units = 'metric' }) {
  const matches = await geocode(query, 1);
  if (!matches.length) {
    throw AppError.notFound(`No location found for "${query}".`, 'CITY_NOT_FOUND');
  }
  const place = matches[0];
  return getWeatherByCoords({ lat: place.lat, lon: place.lon, units, place });
}
