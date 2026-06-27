import { describe, it, expect } from 'vitest';
import {
  formatTemp,
  formatSpeed,
  formatPercent,
  formatVisibility,
  degToCompass,
  uvCategory,
  unitSymbol,
  speedUnit,
  formatTime,
  formatDay,
  formatFullDate,
} from '../src/utils/formatters.js';

describe('temperature & unit helpers', () => {
  it('rounds and appends the degree sign', () => {
    expect(formatTemp(21.4)).toBe('21°');
    expect(formatTemp(21.6)).toBe('22°');
    expect(formatTemp(-0.2)).toBe('0°'); // avoids "-0°"
  });

  it('handles missing temperature gracefully', () => {
    expect(formatTemp(null)).toBe('--°');
    expect(formatTemp(undefined)).toBe('--°');
    expect(formatTemp(NaN)).toBe('--°');
  });

  it('picks the right unit symbols', () => {
    expect(unitSymbol('metric')).toBe('°C');
    expect(unitSymbol('imperial')).toBe('°F');
    expect(speedUnit('metric')).toBe('m/s');
    expect(speedUnit('imperial')).toBe('mph');
  });

  it('formats speed with the matching unit', () => {
    expect(formatSpeed(5.6, 'metric')).toBe('6 m/s');
    expect(formatSpeed(12.2, 'imperial')).toBe('12 mph');
    expect(formatSpeed(null, 'metric')).toBe('-- m/s');
  });

  it('formats percentages', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(72.5)).toBe('73%');
    expect(formatPercent(null)).toBe('--%');
  });
});

describe('formatVisibility', () => {
  it('converts metres to km for metric', () => {
    expect(formatVisibility(10000, 'metric')).toBe('10 km');
    expect(formatVisibility(4500, 'metric')).toBe('5 km');
  });

  it('converts metres to miles for imperial', () => {
    expect(formatVisibility(1609.344, 'imperial')).toBe('1.0 mi');
    expect(formatVisibility(16093.44, 'imperial')).toBe('10.0 mi');
  });

  it('handles missing values', () => {
    expect(formatVisibility(null, 'metric')).toBe('--');
  });
});

describe('degToCompass', () => {
  it('maps cardinal directions', () => {
    expect(degToCompass(0)).toBe('N');
    expect(degToCompass(90)).toBe('E');
    expect(degToCompass(180)).toBe('S');
    expect(degToCompass(270)).toBe('W');
  });

  it('maps intercardinal directions and wraps past 360', () => {
    expect(degToCompass(45)).toBe('NE');
    expect(degToCompass(225)).toBe('SW');
    expect(degToCompass(360)).toBe('N');
    expect(degToCompass(-45)).toBe('NW'); // negative wraps correctly
  });

  it('handles missing values', () => {
    expect(degToCompass(null)).toBe('--');
  });
});

describe('uvCategory', () => {
  it('bands the UV index on the WHO scale', () => {
    expect(uvCategory(0).label).toBe('Low');
    expect(uvCategory(2.9).label).toBe('Low');
    expect(uvCategory(3).label).toBe('Moderate');
    expect(uvCategory(6).label).toBe('High');
    expect(uvCategory(8).label).toBe('Very High');
    expect(uvCategory(11).label).toBe('Extreme');
  });

  it('treats missing UV as low', () => {
    expect(uvCategory(undefined).label).toBe('Low');
  });
});

describe('time formatting in a fixed timezone', () => {
  // 2024-06-27 00:00:00 UTC. In Asia/Jakarta (UTC+7) this is 07:00 local.
  const unix = 1719446400;

  it('renders 24-hour time in the location timezone', () => {
    expect(formatTime(unix, 'Asia/Jakarta', 'en-GB')).toBe('07:00');
    expect(formatTime(unix, 'UTC', 'en-GB')).toBe('00:00');
  });

  it('renders the weekday in the location timezone', () => {
    // 00:00 UTC Thursday is still Thursday in Jakarta (07:00).
    expect(formatDay(unix, 'Asia/Jakarta', 'en-GB')).toBe('Thu');
  });

  it('renders a full human-readable date', () => {
    expect(formatFullDate(unix, 'Asia/Jakarta', 'en-GB')).toBe('Thursday, 27 June 2024');
  });

  it('rolls the date across the timezone boundary', () => {
    // 23:30 UTC on the 27th is 06:30 on the 28th in Jakarta.
    const lateNight = 1719531000; // 2024-06-27 23:30 UTC
    expect(formatDay(lateNight, 'Asia/Jakarta', 'en-GB')).toBe('Fri');
    expect(formatDay(lateNight, 'UTC', 'en-GB')).toBe('Thu');
  });
});
