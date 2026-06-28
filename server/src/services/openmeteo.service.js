import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';
import { fetchJson } from '../utils/fetchJson.js';
import { normaliseWeather, normaliseAirQuality } from '../utils/transform.js';
import { wmoToCondition } from '../utils/wmoCodes.js';

/**
 * Open-Meteo provider.
 *
 * Open-Meteo is free and needs no API key or registration, which makes the
 * dashboard show real live weather with zero setup. It speaks a different
 * dialect than OpenWeather — columnar arrays and WMO weather codes — so this
 * service's job is to translate an Open-Meteo response back into the One Call
 * 3.0 *shape*, then hand it to the SAME normaliseWeather() the OpenWeather path
 * uses. All the rounding/contract rules live in one place (transform.js); we
 * only adapt the upstream payload's structure and weather codes here.
 *
 * Times are requested as `timeformat=unixtime` (UTC seconds) and `timezone=auto`
 * so they line up exactly with what transform.js + time.js already expect.
 */

const { openMeteo } = config.weather;

/** Map metric/imperial to Open-Meteo's per-quantity unit params. */
function unitParams(units) {
  return units === 'imperial'
    ? { temperature_unit: 'fahrenheit', wind_speed_unit: 'mph', precipitation_unit: 'inch' }
    : // OpenWeather "metric" reports wind in m/s, so use `ms` to keep the
      // client formatters producing identical output across providers.
      { temperature_unit: 'celsius', wind_speed_unit: 'ms', precipitation_unit: 'mm' };
}

const HOURLY_VARS = [
  'temperature_2m',
  'weather_code',
  'precipitation_probability',
  'uv_index',
  'dew_point_2m',
  'visibility',
  'wind_speed_10m',
  'relative_humidity_2m',
  'is_day',
];

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'precipitation_probability_max',
  'uv_index_max',
  'wind_speed_10m_max',
];

const CURRENT_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'weather_code',
  'cloud_cover',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
];

/** Index of the hourly bucket at or just before a given timestamp. */
function hourIndexFor(times = [], dt) {
  let idx = 0;
  for (let i = 0; i < times.length; i += 1) {
    if (times[i] <= dt) idx = i;
    else break;
  }
  return idx;
}

/**
 * Reshape an Open-Meteo forecast payload into the One Call 3.0 shape that
 * normaliseWeather() consumes, then normalise it.
 */
export function adaptForecast(data, place, units, air) {
  const offset = data.utc_offset_seconds ?? 0;
  const c = data.current || {};
  const h = data.hourly || {};
  const d = data.daily || {};

  const sunrise = d.sunrise?.[0] ?? null;
  const sunset = d.sunset?.[0] ?? null;

  // Pull current-only-on-hourly variables (uv, dew point, visibility) from the
  // hourly arrays at the bucket matching "now".
  const ci = hourIndexFor(h.time, c.time);

  const current = {
    dt: c.time,
    sunrise,
    sunset,
    temp: c.temperature_2m,
    feels_like: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    pressure: c.surface_pressure,
    uvi: h.uv_index?.[ci] ?? 0,
    visibility: h.visibility?.[ci] ?? null,
    clouds: c.cloud_cover,
    wind_speed: c.wind_speed_10m,
    wind_deg: c.wind_direction_10m,
    wind_gust: c.wind_gusts_10m ?? null,
    dew_point: h.dew_point_2m?.[ci] ?? 0,
    weather: [wmoToCondition(c.weather_code, c.is_day === 1)],
  };

  // Hourly: the next 24 buckets starting from "now" (transform slices to 24).
  const times = h.time || [];
  const hourly = [];
  for (let i = ci; i < times.length && hourly.length < 24; i += 1) {
    hourly.push({
      dt: times[i],
      temp: h.temperature_2m?.[i],
      pop: (h.precipitation_probability?.[i] ?? 0) / 100, // transform re-multiplies
      wind_speed: h.wind_speed_10m?.[i] ?? null,
      humidity: h.relative_humidity_2m?.[i] ?? null,
      weather: [wmoToCondition(h.weather_code?.[i], h.is_day?.[i] === 1)],
    });
  }

  // Daily: 7 days (transform slices to 7).
  const dTimes = d.time || [];
  const daily = dTimes.map((dt, i) => ({
    dt,
    temp: { min: d.temperature_2m_min?.[i], max: d.temperature_2m_max?.[i] },
    pop: (d.precipitation_probability_max?.[i] ?? 0) / 100,
    humidity: null, // Open-Meteo daily has no aggregate humidity.
    wind_speed: d.wind_speed_10m_max?.[i],
    uvi: d.uv_index_max?.[i] ?? 0,
    sunrise: d.sunrise?.[i],
    sunset: d.sunset?.[i],
    summary: '',
    weather: [wmoToCondition(d.weather_code?.[i], true)],
  }));

  const raw = {
    lat: data.latitude,
    lon: data.longitude,
    timezone: data.timezone,
    timezone_offset: offset,
    current,
    hourly,
    daily,
    alerts: [], // Open-Meteo has no severe-weather alerts endpoint.
  };

  return normaliseWeather(raw, place, units, air);
}

/** City name -> candidate locations (autocomplete + search resolution). */
export async function geocode(query, limit = 5) {
  if (!query || !query.trim()) return [];
  const url =
    `${openMeteo.geoUrl}?name=${encodeURIComponent(query)}` +
    `&count=${limit}&language=en&format=json`;
  const data = await fetchJson(url);
  return (data?.results || []).map((c) => ({
    name: c.name,
    country: c.country_code || c.country || '',
    state: c.admin1 || '',
    lat: c.latitude,
    lon: c.longitude,
  }));
}

/** Coordinates -> nearest place name (keyless reverse geocoding). */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `${openMeteo.reverseUrl}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const data = await fetchJson(url, { timeoutMs: 5000 });
    const name = data?.city || data?.locality || data?.principalSubdivision;
    if (!name) return [];
    return [
      {
        name,
        country: data.countryCode || '',
        state: data.principalSubdivision || '',
        lat,
        lon,
      },
    ];
  } catch {
    // Reverse geocoding is a convenience; a missing place name must not break
    // the GPS weather lookup.
    return [];
  }
}

/** Air quality is a separate endpoint; failures are non-fatal. */
async function getAirQuality(lat, lon) {
  try {
    const url =
      `${openMeteo.airUrl}?latitude=${lat}&longitude=${lon}` +
      `&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&timezone=auto`;
    const data = await fetchJson(url, { timeoutMs: 5000 });
    const cur = data?.current;
    if (!cur || cur.us_aqi == null) return null;
    // Re-shape into the OpenWeather air-pollution payload normaliseAirQuality
    // understands (1–5 banded index), so the rest of the app is unchanged.
    return normaliseAirQuality({
      list: [
        {
          main: { aqi: usAqiToBand(cur.us_aqi) },
          components: {
            pm2_5: cur.pm2_5,
            pm10: cur.pm10,
            o3: cur.ozone,
            no2: cur.nitrogen_dioxide,
          },
        },
      ],
    });
  } catch {
    return null;
  }
}

/** US AQI (0–500) -> OpenWeather 1–5 band. */
function usAqiToBand(aqi) {
  if (aqi <= 50) return 1;
  if (aqi <= 100) return 2;
  if (aqi <= 150) return 3;
  if (aqi <= 200) return 4;
  return 5;
}

/** Coordinates -> fully normalised weather payload. */
export async function getWeatherByCoords({ lat, lon, units = 'metric', place = null }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw AppError.badRequest('Valid lat and lon are required.', 'INVALID_COORDS');
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: '7',
    current: CURRENT_VARS.join(','),
    hourly: HOURLY_VARS.join(','),
    daily: DAILY_VARS.join(','),
    ...unitParams(units),
  });
  const url = `${openMeteo.forecastUrl}?${params.toString()}`;

  // Forecast, air quality, and (if needed) place name resolved in parallel.
  const [data, air, resolvedPlace] = await Promise.all([
    fetchJson(url),
    getAirQuality(lat, lon),
    place ? Promise.resolve(place) : reverseGeocode(lat, lon).then((p) => p[0] || null),
  ]);

  return { data: adaptForecast(data, resolvedPlace, units, air), demo: false };
}

/** Resolve a city name then fetch its weather. */
export async function getWeatherByCity({ query, units = 'metric' }) {
  const matches = await geocode(query, 1);
  if (!matches.length) {
    throw AppError.notFound(`No location found for "${query}".`, 'CITY_NOT_FOUND');
  }
  const place = matches[0];
  return getWeatherByCoords({ lat: place.lat, lon: place.lon, units, place });
}
