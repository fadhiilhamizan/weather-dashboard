/**
 * Open-Meteo speaks WMO weather-interpretation codes (0–99), while the rest of
 * this app (the client's categorize() and WeatherIcon, the sky engine) keys off
 * OpenWeather condition IDs. To keep the client contract identical regardless of
 * provider, we translate each WMO code into an OpenWeather-equivalent condition
 * object here. This is the only place provider weather codes are mapped, mirror-
 * ing the role transform.js plays for the overall payload shape.
 *
 * WMO reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 * OpenWeather reference: https://openweathermap.org/weather-conditions
 */

// One entry per WMO code we expect. `id` is an OpenWeather-equivalent code so
// downstream categorize()/icon logic resolves to the right visual bucket.
const WMO = {
  0: { id: 800, main: 'Clear', description: 'clear sky', icon: '01' },
  1: { id: 801, main: 'Clouds', description: 'mainly clear', icon: '02' },
  2: { id: 802, main: 'Clouds', description: 'partly cloudy', icon: '03' },
  3: { id: 804, main: 'Clouds', description: 'overcast', icon: '04' },

  45: { id: 741, main: 'Fog', description: 'fog', icon: '50' },
  48: { id: 741, main: 'Fog', description: 'depositing rime fog', icon: '50' },

  51: { id: 300, main: 'Drizzle', description: 'light drizzle', icon: '09' },
  53: { id: 301, main: 'Drizzle', description: 'moderate drizzle', icon: '09' },
  55: { id: 302, main: 'Drizzle', description: 'dense drizzle', icon: '09' },
  56: { id: 300, main: 'Drizzle', description: 'light freezing drizzle', icon: '09' },
  57: { id: 302, main: 'Drizzle', description: 'dense freezing drizzle', icon: '09' },

  61: { id: 500, main: 'Rain', description: 'light rain', icon: '10' },
  63: { id: 501, main: 'Rain', description: 'moderate rain', icon: '10' },
  65: { id: 502, main: 'Rain', description: 'heavy rain', icon: '10' },
  66: { id: 511, main: 'Rain', description: 'light freezing rain', icon: '13' },
  67: { id: 511, main: 'Rain', description: 'heavy freezing rain', icon: '13' },

  71: { id: 600, main: 'Snow', description: 'light snow', icon: '13' },
  73: { id: 601, main: 'Snow', description: 'moderate snow', icon: '13' },
  75: { id: 602, main: 'Snow', description: 'heavy snow', icon: '13' },
  77: { id: 600, main: 'Snow', description: 'snow grains', icon: '13' },

  80: { id: 520, main: 'Rain', description: 'light rain showers', icon: '09' },
  81: { id: 521, main: 'Rain', description: 'moderate rain showers', icon: '09' },
  82: { id: 522, main: 'Rain', description: 'violent rain showers', icon: '09' },
  85: { id: 620, main: 'Snow', description: 'light snow showers', icon: '13' },
  86: { id: 622, main: 'Snow', description: 'heavy snow showers', icon: '13' },

  95: { id: 211, main: 'Thunderstorm', description: 'thunderstorm', icon: '11' },
  96: { id: 211, main: 'Thunderstorm', description: 'thunderstorm with light hail', icon: '11' },
  99: { id: 211, main: 'Thunderstorm', description: 'thunderstorm with heavy hail', icon: '11' },
};

/**
 * WMO code (+ day/night flag) -> OpenWeather-equivalent condition object, in the
 * exact `{ id, main, description, icon }` shape transform.js expects in a
 * weather entry's `weather[0]`.
 */
export function wmoToCondition(code, isDay = true) {
  const base = WMO[code] || WMO[0];
  return {
    id: base.id,
    main: base.main,
    description: base.description,
    icon: `${base.icon}${isDay ? 'd' : 'n'}`,
  };
}
