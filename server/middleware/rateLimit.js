import { httpError } from '../lib/http.js';

const buckets = new Map();

/**
 * Small dependency-free fixed-window limiter for public write endpoints.
 */
export function rateLimit({ windowMs = 10 * 60 * 1000, max = 20 } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return next(httpError(429, 'Too many requests. Please try again later.'));
    }

    return next();
  };
}

// Keep the map from growing forever on long-running instances.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();