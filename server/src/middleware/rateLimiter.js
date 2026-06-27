import { config } from '../config.js';

/**
 * A tiny fixed-window, per-IP rate limiter.
 *
 * The brief calls out "over-fetching / burning quota" as the #1 anti-pattern.
 * Caching handles repeated identical requests; this handles a single abusive
 * client hammering many different cities. For multi-instance deployments you'd
 * move this state into Redis, but the contract stays the same.
 */
const hits = new Map(); // ip -> { count, resetAt }

export function rateLimiter(req, res, next) {
  const windowMs = config.rateLimit.windowSeconds * 1000;
  const max = config.rateLimit.maxRequests;
  const now = Date.now();
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';

  let entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    hits.set(ip, entry);
  }
  entry.count += 1;

  const remaining = Math.max(0, max - entry.count);
  res.set('X-RateLimit-Limit', String(max));
  res.set('X-RateLimit-Remaining', String(remaining));
  res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down and try again shortly.',
      },
    });
  }

  return next();
}

// Opportunistically clear stale buckets so the Map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(ip);
  }
}, 60_000).unref?.();
