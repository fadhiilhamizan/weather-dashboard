import { describe, it, expect } from 'vitest';
import { wmoToCondition } from '../src/utils/wmoCodes.js';
import { categorize } from '../../client/src/utils/weatherCodes.js';

describe('wmoToCondition', () => {
  it('maps clear sky (0) to an OpenWeather clear id', () => {
    const c = wmoToCondition(0, true);
    expect(c.id).toBe(800);
    expect(categorize(c.id)).toBe('clear');
  });

  it('appends the day/night suffix to the icon', () => {
    expect(wmoToCondition(0, true).icon).toBe('01d');
    expect(wmoToCondition(0, false).icon).toBe('01n');
  });

  it('maps each WMO band to the matching visual category', () => {
    expect(categorize(wmoToCondition(3).id)).toBe('clouds'); // overcast
    expect(categorize(wmoToCondition(45).id)).toBe('atmosphere'); // fog
    expect(categorize(wmoToCondition(53).id)).toBe('drizzle');
    expect(categorize(wmoToCondition(63).id)).toBe('rain');
    expect(categorize(wmoToCondition(73).id)).toBe('snow');
    expect(categorize(wmoToCondition(95).id)).toBe('thunderstorm');
  });

  it('falls back to clear for an unknown code', () => {
    expect(wmoToCondition(1234).id).toBe(800);
  });
});
