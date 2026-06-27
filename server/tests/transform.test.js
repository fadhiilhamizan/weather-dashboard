import { describe, it, expect } from 'vitest';
import { normaliseWeather, normaliseAirQuality } from '../src/utils/transform.js';

const place = { name: 'Surabaya', country: 'ID', state: 'East Java' };

function rawSample() {
  const now = 1_751_000_000;
  return {
    lat: -7.25,
    lon: 112.75,
    timezone: 'Asia/Jakarta',
    timezone_offset: 25200,
    current: {
      dt: now,
      sunrise: now - 3600,
      sunset: now + 3600,
      temp: 30.7,
      feels_like: 33.2,
      humidity: 70,
      pressure: 1010,
      uvi: 8.34,
      visibility: 10000,
      clouds: 20,
      wind_speed: 4.1,
      wind_deg: 180,
      dew_point: 24.6,
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    },
    hourly: Array.from({ length: 48 }, (_, i) => ({
      dt: now + i * 3600,
      temp: 28 + i * 0.1,
      pop: 0.42,
      weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
    })),
    daily: Array.from({ length: 8 }, (_, i) => ({
      dt: now + i * 86400,
      temp: { min: 24.4, max: 31.6 },
      pop: 0.6,
      humidity: 65,
      wind_speed: 3.3,
      uvi: 9.1,
      sunrise: now,
      sunset: now + 3600,
      summary: 'Sunny',
      weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
    })),
    alerts: [
      {
        sender_name: 'BMKG',
        event: 'Flood Warning',
        start: now,
        end: now + 7200,
        description: 'Heavy rain expected.',
        tags: ['Rain'],
      },
    ],
  };
}

describe('normaliseWeather', () => {
  it('rounds the current temperature and feels-like', () => {
    const out = normaliseWeather(rawSample(), place, 'metric');
    expect(out.current.temp).toBe(31);
    expect(out.current.feelsLike).toBe(33);
  });

  it('rounds uvi to one decimal place', () => {
    const out = normaliseWeather(rawSample(), place, 'metric');
    expect(out.current.uvi).toBe(8.3);
  });

  it('limits hourly to 24 entries and converts pop to a percentage', () => {
    const out = normaliseWeather(rawSample(), place, 'metric');
    expect(out.hourly).toHaveLength(24);
    expect(out.hourly[0].pop).toBe(42);
  });

  it('limits daily to 7 entries', () => {
    const out = normaliseWeather(rawSample(), place, 'metric');
    expect(out.daily).toHaveLength(7);
    expect(out.daily[0].tempMin).toBe(24);
    expect(out.daily[0].tempMax).toBe(32);
  });

  it('passes through the place name and units', () => {
    const out = normaliseWeather(rawSample(), place, 'imperial');
    expect(out.location.name).toBe('Surabaya');
    expect(out.units).toBe('imperial');
  });

  it('maps alerts into a clean shape', () => {
    const out = normaliseWeather(rawSample(), place, 'metric');
    expect(out.alerts).toHaveLength(1);
    expect(out.alerts[0]).toMatchObject({ event: 'Flood Warning', sender: 'BMKG' });
  });

  it('falls back to a Clear condition when weather data is missing', () => {
    const raw = rawSample();
    raw.current.weather = [];
    const out = normaliseWeather(raw, place, 'metric');
    expect(out.current.condition.main).toBe('Clear');
  });

  it('tolerates a null place', () => {
    const out = normaliseWeather(rawSample(), null, 'metric');
    expect(out.location.name).toBeNull();
  });
});

describe('normaliseAirQuality', () => {
  it('maps the AQI index to a label', () => {
    const out = normaliseAirQuality({ list: [{ main: { aqi: 3 }, components: { pm2_5: 12 } }] });
    expect(out).toMatchObject({ aqi: 3, label: 'Moderate' });
    expect(out.components.pm2_5).toBe(12);
  });

  it('returns null when there is no data', () => {
    expect(normaliseAirQuality({})).toBeNull();
    expect(normaliseAirQuality({ list: [] })).toBeNull();
  });
});
