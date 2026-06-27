/**
 * Demo-mode data generator.
 *
 * When no API key is configured the proxy serves data from here instead of
 * failing. The output deliberately mimics the OpenWeather One Call 3.0 shape so
 * it flows through the exact same transform layer as real data — the rest of
 * the app can't tell the difference. Values are pseudo-random but believable:
 * a smooth daily temperature curve, latitude-aware baseline, and a plausible
 * mix of conditions.
 */

const HOUR = 3600;
const DAY = 86400;

// A small palette of OpenWeather condition codes to rotate through.
const CONDITIONS = [
  { id: 800, main: 'Clear', description: 'clear sky', icon: '01' },
  { id: 801, main: 'Clouds', description: 'few clouds', icon: '02' },
  { id: 803, main: 'Clouds', description: 'broken clouds', icon: '04' },
  { id: 500, main: 'Rain', description: 'light rain', icon: '10' },
  { id: 211, main: 'Thunderstorm', description: 'thunderstorm', icon: '11' },
];

// Deterministic-ish pseudo random so the same coords feel stable within a run.
function seeded(seed) {
  let s = Math.sin(seed) * 10000;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}

function dayIcon(icon, dt, sunrise, sunset) {
  const isDay = dt >= sunrise && dt < sunset;
  return `${icon}${isDay ? 'd' : 'n'}`;
}

export function buildMockWeather({ lat = -7.25, lon = 112.75 } = {}) {
  const rand = seeded(Math.abs(lat * 1000 + lon));
  const now = Math.floor(Date.now() / 1000);
  const nowDate = new Date(now * 1000);

  // Latitude-aware baseline: warmer near the equator.
  const base = 30 - Math.abs(lat) * 0.4;
  // Day length proxy.
  const sunriseToday = Math.floor(now / DAY) * DAY + 6 * HOUR;
  const sunsetToday = Math.floor(now / DAY) * DAY + 18 * HOUR;

  const tempAt = (ts) => {
    const hourOfDay = new Date(ts * 1000).getUTCHours();
    // Peak around 14:00, trough around 03:00.
    const curve = Math.sin(((hourOfDay - 9) / 24) * Math.PI * 2);
    return Math.round((base + curve * 5 + (rand() - 0.5) * 2) * 10) / 10;
  };

  const pickCondition = () => CONDITIONS[Math.floor(rand() * CONDITIONS.length)];
  const cur = pickCondition();

  const current = {
    dt: now,
    sunrise: sunriseToday,
    sunset: sunsetToday,
    temp: tempAt(now),
    feels_like: tempAt(now) + (rand() - 0.5) * 2,
    pressure: 1008 + Math.round(rand() * 12),
    humidity: 60 + Math.round(rand() * 30),
    dew_point: tempAt(now) - 4,
    uvi: Math.round(rand() * 9 * 10) / 10,
    clouds: Math.round(rand() * 80),
    visibility: 10000,
    wind_speed: Math.round(rand() * 8 * 10) / 10,
    wind_deg: Math.round(rand() * 360),
    wind_gust: Math.round(rand() * 12 * 10) / 10,
    weather: [{ ...cur, icon: dayIcon(cur.icon, now, sunriseToday, sunsetToday) }],
  };

  const hourly = Array.from({ length: 24 }, (_, i) => {
    const dt = now + i * HOUR;
    const c = rand() > 0.75 ? pickCondition() : cur;
    return {
      dt,
      temp: tempAt(dt),
      feels_like: tempAt(dt),
      pop: Math.round(rand() * 100) / 100,
      weather: [{ ...c, icon: dayIcon(c.icon, dt, sunriseToday, sunsetToday) }],
    };
  });

  const daily = Array.from({ length: 7 }, (_, i) => {
    const dt = now + i * DAY;
    const dayTemp = base + (rand() - 0.5) * 4;
    const c = pickCondition();
    return {
      dt,
      sunrise: sunriseToday + i * DAY,
      sunset: sunsetToday + i * DAY,
      temp: {
        min: Math.round((dayTemp - 4) * 10) / 10,
        max: Math.round((dayTemp + 5) * 10) / 10,
        day: dayTemp,
        night: dayTemp - 5,
      },
      feels_like: { day: dayTemp + 1 },
      pressure: 1008 + Math.round(rand() * 12),
      humidity: 55 + Math.round(rand() * 35),
      wind_speed: Math.round(rand() * 9 * 10) / 10,
      wind_deg: Math.round(rand() * 360),
      uvi: Math.round(rand() * 10 * 10) / 10,
      pop: Math.round(rand() * 100) / 100,
      summary: 'Expect a mix of sun and clouds throughout the day.',
      weather: [{ ...c, icon: `${c.icon}d` }],
    };
  });

  // Occasionally surface a weather alert so that UI path is demonstrable.
  const alerts =
    rand() > 0.6
      ? [
          {
            sender_name: 'Atmosfer Demo Service',
            event: 'Heat Advisory',
            start: now,
            end: now + 6 * HOUR,
            description:
              'High temperatures expected this afternoon. Stay hydrated and limit outdoor activity between 12:00 and 15:00. (Demo alert — connect a real API key for live alerts.)',
            tags: ['Extreme high temperature'],
          },
        ]
      : [];

  const raw = {
    lat,
    lon,
    timezone: 'Asia/Jakarta',
    timezone_offset: 25200, // +7h; demo default. Reverse geocode overrides name.
    current,
    hourly,
    daily,
    alerts,
  };

  const air = {
    list: [
      {
        main: { aqi: 1 + Math.floor(rand() * 4) },
        components: {
          pm2_5: Math.round(rand() * 40 * 10) / 10,
          pm10: Math.round(rand() * 60 * 10) / 10,
          o3: Math.round(rand() * 120 * 10) / 10,
          no2: Math.round(rand() * 50 * 10) / 10,
        },
      },
    ],
  };

  return { raw, air, lastUpdated: nowDate.toISOString() };
}

// A short list of well-known cities so demo-mode search/autocomplete works.
const DEMO_CITIES = [
  { name: 'Surabaya', country: 'ID', state: 'East Java', lat: -7.2575, lon: 112.7521 },
  { name: 'Jakarta', country: 'ID', state: 'Jakarta', lat: -6.2146, lon: 106.8451 },
  { name: 'Bandung', country: 'ID', state: 'West Java', lat: -6.9175, lon: 107.6191 },
  { name: 'Yogyakarta', country: 'ID', state: 'Yogyakarta', lat: -7.7956, lon: 110.3695 },
  { name: 'Denpasar', country: 'ID', state: 'Bali', lat: -8.6705, lon: 115.2126 },
  { name: 'Medan', country: 'ID', state: 'North Sumatra', lat: 3.5952, lon: 98.6722 },
  { name: 'Tokyo', country: 'JP', state: 'Tokyo', lat: 35.6895, lon: 139.6917 },
  { name: 'Singapore', country: 'SG', state: '', lat: 1.2897, lon: 103.8501 },
  { name: 'London', country: 'GB', state: 'England', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', country: 'US', state: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Sydney', country: 'AU', state: 'New South Wales', lat: -33.8688, lon: 151.2093 },
  { name: 'Paris', country: 'FR', state: 'Île-de-France', lat: 48.8566, lon: 2.3522 },
];

export function mockGeocode(query, limit = 5) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  return DEMO_CITIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, limit);
}

export function mockReverseGeocode(lat, lon) {
  // Return the nearest demo city by naive distance.
  let nearest = DEMO_CITIES[0];
  let best = Infinity;
  for (const c of DEMO_CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
    if (d < best) {
      best = d;
      nearest = c;
    }
  }
  return [nearest];
}
