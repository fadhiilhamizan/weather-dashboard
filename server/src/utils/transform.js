import { isDaytime } from './time.js';

/**
 * Transform / anti-corruption layer.
 *
 * The frontend should never see the provider's raw payload. If we ever swap
 * OpenWeather for WeatherAPI or Open-Meteo, only this file changes — the
 * contract with the client stays identical. That decoupling is the whole point
 * of having a backend proxy in the first place.
 */

const condition = (weatherArray = []) => {
  const w = weatherArray[0] || {};
  return {
    id: w.id ?? 800,
    main: w.main ?? 'Clear',
    description: w.description ?? 'clear sky',
    icon: w.icon ?? '01d',
  };
};

// OpenWeather Air Quality Index is 1–5; map it to a human label.
const AQI_LABELS = ['Unknown', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

export function normaliseAirQuality(payload) {
  const entry = payload?.list?.[0];
  if (!entry) return null;
  const aqi = entry.main?.aqi ?? 0;
  return {
    aqi,
    label: AQI_LABELS[aqi] || 'Unknown',
    components: entry.components || {},
  };
}

/**
 * @param {object} raw         One Call 3.0 response.
 * @param {object} place       { name, country, state } from geocoding.
 * @param {string} units       'metric' | 'imperial'.
 * @param {object|null} air    normalised air quality, or null.
 */
export function normaliseWeather(raw, place, units, air = null) {
  const offset = raw.timezone_offset ?? 0;
  const cur = raw.current || {};

  const current = {
    dt: cur.dt,
    temp: Math.round(cur.temp),
    feelsLike: Math.round(cur.feels_like),
    humidity: cur.humidity,
    pressure: cur.pressure,
    uvi: Math.round((cur.uvi ?? 0) * 10) / 10,
    visibility: cur.visibility ?? null,
    clouds: cur.clouds,
    windSpeed: cur.wind_speed,
    windDeg: cur.wind_deg,
    windGust: cur.wind_gust ?? null,
    dewPoint: Math.round(cur.dew_point),
    sunrise: cur.sunrise,
    sunset: cur.sunset,
    condition: condition(cur.weather),
    isDay: isDaytime(cur.dt, cur.sunrise, cur.sunset),
  };

  // Next 24 hours, hour by hour.
  const hourly = (raw.hourly || []).slice(0, 24).map((h) => ({
    dt: h.dt,
    temp: Math.round(h.temp),
    pop: Math.round((h.pop ?? 0) * 100),
    condition: condition(h.weather),
    isDay: isDaytime(h.dt, current.sunrise, current.sunset),
  }));

  // Next 7 days (drop today's partial-ish first entry only if you prefer; we
  // keep all 7 so "today" shows its full min/max).
  const daily = (raw.daily || []).slice(0, 7).map((d) => ({
    dt: d.dt,
    tempMin: Math.round(d.temp?.min),
    tempMax: Math.round(d.temp?.max),
    pop: Math.round((d.pop ?? 0) * 100),
    humidity: d.humidity,
    windSpeed: d.wind_speed,
    uvi: Math.round((d.uvi ?? 0) * 10) / 10,
    sunrise: d.sunrise,
    sunset: d.sunset,
    summary: d.summary || '',
    condition: condition(d.weather),
  }));

  const alerts = (raw.alerts || []).map((a) => ({
    event: a.event,
    sender: a.sender_name,
    start: a.start,
    end: a.end,
    description: a.description,
    tags: a.tags || [],
  }));

  return {
    location: {
      name: place?.name ?? null,
      country: place?.country ?? null,
      state: place?.state ?? null,
      lat: raw.lat,
      lon: raw.lon,
      timezone: raw.timezone,
      timezoneOffset: offset,
    },
    units,
    current,
    hourly,
    daily,
    alerts,
    airQuality: air,
  };
}
