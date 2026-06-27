import { describe, it, expect } from 'vitest';
import {
  isDaytime,
  localWeekday,
  localHour,
  localDateKey,
} from '../src/utils/time.js';

describe('time utils', () => {
  // 2026-06-27T05:00:00Z (a Saturday). UTC weekday for Saturday is 6.
  const sat = Math.floor(Date.UTC(2026, 5, 27, 5, 0, 0) / 1000);

  describe('isDaytime', () => {
    it('is true between sunrise and sunset', () => {
      expect(isDaytime(100, 50, 200)).toBe(true);
    });
    it('is false before sunrise', () => {
      expect(isDaytime(40, 50, 200)).toBe(false);
    });
    it('is false at/after sunset', () => {
      expect(isDaytime(200, 50, 200)).toBe(false);
    });
    it('defaults to daytime when sun data is missing', () => {
      expect(isDaytime(100, null, undefined)).toBe(true);
    });
  });

  describe('localWeekday', () => {
    it('returns the UTC weekday with no offset', () => {
      expect(localWeekday(sat, 0)).toBe(6);
    });
    it('rolls forward to Sunday when a positive offset crosses midnight', () => {
      // 05:00Z + 20h = 01:00 next day -> Sunday (0).
      expect(localWeekday(sat, 20 * 3600)).toBe(0);
    });
  });

  describe('localHour', () => {
    it('applies the timezone offset', () => {
      // 05:00Z + 7h (Jakarta) = 12:00 local.
      expect(localHour(sat, 7 * 3600)).toBe(12);
    });
    it('wraps a negative offset correctly', () => {
      // 05:00Z - 8h = 21:00 previous day.
      expect(localHour(sat, -8 * 3600)).toBe(21);
    });
  });

  describe('localDateKey', () => {
    it('formats a zero-padded YYYY-MM-DD in local time', () => {
      expect(localDateKey(sat, 7 * 3600)).toBe('2026-06-27');
    });
    it('advances the date when offset crosses midnight', () => {
      expect(localDateKey(sat, 20 * 3600)).toBe('2026-06-28');
    });
  });
});
