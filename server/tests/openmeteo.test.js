import { describe, it, expect } from 'vitest';
import { adaptForecast } from '../src/services/openmeteo.service.js';

const place = { name: 'Surabaya', country: 'ID', state: 'East Java' };

// A trimmed but structurally faithful Open-Meteo response (timeformat=unixtime).
function omSample() {
  const now = 1_751_000_000;
  const hours = 30;
  return {
    latitude: -7.25,
    longitude: 112.75,
    timezone: 'Asia/Jakarta',
    utc_offset_seconds: 25200,
    current: {
      time: now,
      temperature_2m: 30.7,
      relative_humidity_2m: 70,
      apparent_temperature: 33.2,
      is_day: 1,
      weather_code: 0,
      cloud_cover: 20,
      surface_pressure: 1010,
      wind_speed_10m: 4.1,
      wind_direction_10m: 180,
      wind_gusts_10m: 6.2,
    },
    hourly: {
      time: Array.from({ length: hours }, (_, i) => now + i * 3600),
      temperature_2m: Array.from({ length: hours }, (_, i) => 28 + i * 0.1),
      weather_code: Array.from({ length: hours }, () => 61),
      precipitation_probability: Array.from({ length: hours }, () => 42),
      uv_index: Array.from({ length: hours }, () => 8.34),
      dew_point_2m: Array.from({ length: hours }, () => 24.6),
      visibility: Array.from({ length: hours }, () => 10000),
      is_day: Array.from({ length: hours }, () => 1),
    },
    daily: {
      time: Array.from({ length: 7 }, (_, i) => now + i * 86400),
      weather_code: Array.from({ length: 7 }, () => 2),
      temperature_2m_max: Array.from({ length: 7 }, () => 31.6),
      temperature_2m_min: Array.from({ length: 7 }, () => 24.4),
      sunrise: Array.from({ length: 7 }, (_, i) => now - 3600 + i * 86400),
      sunset: Array.from({ length: 7 }, (_, i) => now + 3600 + i * 86400),
      precipitation_probability_max: Array.from({ length: 7 }, () => 60),
      uv_index_max: Array.from({ length: 7 }, () => 9.1),
      wind_speed_10m_max: Array.from({ length: 7 }, () => 3.3),
    },
  };
}

describe('adaptForecast (Open-Meteo -> contract)', () => {
  it('produces the same contract shape as the OpenWeather path', () => {
    const out = adaptForecast(omSample(), place, 'metric', null);
    expect(out.current.temp).toBe(31);
    expect(out.current.feelsLike).toBe(33);
    expect(out.current.uvi).toBe(8.3);
    expect(out.current.condition.id).toBe(800); // WMO 0 -> clear
    expect(out.current.isDay).toBe(true);
  });

  it('limits hourly to 24 and converts pop to a percentage', () => {
    const out = adaptForecast(omSample(), place, 'metric', null);
    expect(out.hourly).toHaveLength(24);
    expect(out.hourly[0].pop).toBe(42);
  });

  it('limits daily to 7 and rounds min/max', () => {
    const out = adaptForecast(omSample(), place, 'metric', null);
    expect(out.daily).toHaveLength(7);
    expect(out.daily[0].tempMin).toBe(24);
    expect(out.daily[0].tempMax).toBe(32);
  });

  it('carries location, timezone offset, and empty alerts through', () => {
    const out = adaptForecast(omSample(), place, 'imperial', null);
    expect(out.location.name).toBe('Surabaya');
    expect(out.location.timezoneOffset).toBe(25200);
    expect(out.units).toBe('imperial');
    expect(out.alerts).toEqual([]);
  });
});
