import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TtlCache } from '../src/services/cache.service.js';

describe('TtlCache', () => {
  let cache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new TtlCache({ maxEntries: 3, sweepIntervalMs: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves a value within its TTL', async () => {
    await cache.set('a', 1, 60);
    expect(await cache.get('a')).toBe(1);
  });

  it('returns null for a missing key', async () => {
    expect(await cache.get('nope')).toBeNull();
  });

  it('expires entries after the TTL elapses', async () => {
    await cache.set('a', 1, 1); // 1 second
    expect(await cache.get('a')).toBe(1);
    vi.advanceTimersByTime(1001);
    expect(await cache.get('a')).toBeNull();
  });

  it('evicts the oldest entry when over capacity', async () => {
    await cache.set('a', 1, 60);
    await cache.set('b', 2, 60);
    await cache.set('c', 3, 60);
    await cache.set('d', 4, 60); // should push out 'a'
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('d')).toBe(4);
  });

  describe('wrap (cache-aside)', () => {
    it('runs the producer on a miss and caches the result', async () => {
      const producer = vi.fn().mockResolvedValue('fresh');
      const first = await cache.wrap('k', 60, producer);
      expect(first).toEqual({ value: 'fresh', cached: false });
      expect(producer).toHaveBeenCalledTimes(1);
    });

    it('serves from cache on a hit without calling the producer again', async () => {
      const producer = vi.fn().mockResolvedValue('fresh');
      await cache.wrap('k', 60, producer);
      const second = await cache.wrap('k', 60, producer);
      expect(second).toEqual({ value: 'fresh', cached: true });
      expect(producer).toHaveBeenCalledTimes(1);
    });
  });

  it('tracks hit/miss stats', async () => {
    await cache.set('a', 1, 60);
    await cache.get('a'); // hit
    await cache.get('b'); // miss
    const stats = cache.stats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });
});
