import { describe, it, expect } from 'vitest';
import { moonPhase } from '../src/utils/moon.js';

describe('moonPhase', () => {
  it('reports a new moon at the epoch', () => {
    const m = moonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14)));
    expect(m.label).toBe('New Moon');
    expect(m.illumination).toBeLessThan(0.02);
  });

  it('reports a full moon ~14.75 days later', () => {
    const epoch = Date.UTC(2000, 0, 6, 18, 14);
    const full = new Date(epoch + 14.77 * 86400000);
    const m = moonPhase(full);
    expect(m.label).toBe('Full Moon');
    expect(m.illumination).toBeGreaterThan(0.98);
  });

  it('is waxing in the first half of the cycle', () => {
    const epoch = Date.UTC(2000, 0, 6, 18, 14);
    expect(moonPhase(new Date(epoch + 5 * 86400000)).waxing).toBe(true);
    expect(moonPhase(new Date(epoch + 20 * 86400000)).waxing).toBe(false);
  });

  it('returns illumination within [0,1]', () => {
    for (let d = 0; d < 30; d += 1) {
      const m = moonPhase(new Date(Date.UTC(2024, 0, 1 + d)));
      expect(m.illumination).toBeGreaterThanOrEqual(0);
      expect(m.illumination).toBeLessThanOrEqual(1);
    }
  });
});
