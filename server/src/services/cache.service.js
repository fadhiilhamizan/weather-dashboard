/**
 * In-memory cache with per-entry TTL.
 *
 * This is the piece that stops the dashboard from "burning" the API quota: a
 * repeated request for the same city within the TTL window is served from
 * memory instead of hitting the provider again.
 *
 * The interface (get / set / wrap) is intentionally tiny and async so it can be
 * swapped for Redis in production with no change to the call sites — see the
 * note in README about scaling.
 */
export class TtlCache {
  constructor({ maxEntries = 500, sweepIntervalMs = 60_000 } = {}) {
    /** @type {Map<string, { value: any, expiresAt: number }>} */
    this.store = new Map();
    this.maxEntries = maxEntries;
    this.hits = 0;
    this.misses = 0;

    // Periodically evict expired keys so memory doesn't grow unbounded. unref()
    // keeps this timer from holding the process open during tests/shutdown.
    if (sweepIntervalMs > 0) {
      this.sweeper = setInterval(() => this.sweep(), sweepIntervalMs);
      if (typeof this.sweeper.unref === 'function') this.sweeper.unref();
    }
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.misses += 1;
      return null;
    }
    this.hits += 1;
    return entry.value;
  }

  async set(key, value, ttlSeconds) {
    // Naive size cap: drop the oldest insertion when full.
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return value;
  }

  /**
   * Cache-aside helper: return the cached value, or run `producer`, cache its
   * result, and return that. Marks whether the result was a cache hit so the
   * controller can expose it via an `X-Cache` header.
   */
  async wrap(key, ttlSeconds, producer) {
    const cached = await this.get(key);
    if (cached !== null) return { value: cached, cached: true };
    const value = await producer();
    await this.set(key, value, ttlSeconds);
    return { value, cached: false };
  }

  sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }

  stats() {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : Math.round((this.hits / total) * 100) / 100,
    };
  }
}

// A single shared instance for the app.
export const cache = new TtlCache();
