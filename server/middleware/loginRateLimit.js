const attempts = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function keyFor(req, email) {
  return `${req.ip}:${String(email || '').toLowerCase()}`;
}

/**
 * Tracks failed sign-in attempts per IP + email. Successful sign-ins clear
 * the bucket, so normal users are never locked out.
 */
export function loginRateLimit(req, res, next) {
  const key = keyFor(req, req.body?.email);
  const now = Date.now();
  const bucket = attempts.get(key);

  if (bucket && bucket.resetAt > now && bucket.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    const error = new Error(`Too many sign-in attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
    error.status = 429;
    return next(error);
  }

  return next();
}

export function recordLoginFailure(req, email) {
  const key = keyFor(req, email);
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.count += 1;
}

export function clearLoginFailures(req, email) {
  attempts.delete(keyFor(req, email));
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of attempts) {
    if (bucket.resetAt <= now) attempts.delete(key);
  }
}, 5 * 60 * 1000).unref();