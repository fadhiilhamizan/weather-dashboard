import { config } from '../config.js';
import * as openweather from './weather.service.js';
import * as openmeteo from './openmeteo.service.js';

/**
 * Provider facade. Controllers import the weather functions from here and stay
 * oblivious to which upstream is active — selection happens once, based on
 * config.weather.provider:
 *   - 'openmeteo'   -> keyless Open-Meteo (default when no API key is set)
 *   - 'openweather' -> OpenWeather One Call 3.0 (when OPENWEATHER_API_KEY is set)
 *   - 'demo'        -> mock data, handled inside weather.service.js
 *
 * The 'openweather' module also owns the demo path (it branches on
 * config.weather.demoMode), so anything that isn't Open-Meteo routes there.
 */
const impl = config.weather.provider === 'openmeteo' ? openmeteo : openweather;

export const provider = config.weather.provider;

export const geocode = impl.geocode;
export const reverseGeocode = impl.reverseGeocode;
export const getWeatherByCoords = impl.getWeatherByCoords;
export const getWeatherByCity = impl.getWeatherByCity;
