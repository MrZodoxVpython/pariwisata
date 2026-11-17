// Vercel serverless entry point. All /api/* requests are handled by the
// existing Express app.
//
// Vercel's plain @vercel/node catch-all (`api/[...path].js`) only matches a
// single path segment, so nested routes such as /api/admin/auth/login never
// reach the function. `vercel.json` therefore rewrites every /api/:path* to
// this file, and the original path is forwarded in req.url.

// The Express app is loaded lazily so a bootstrap failure (e.g. a missing
// dependency) is reported as a readable JSON error instead of Vercel's
// generic "FUNCTION_INVOCATION_FAILED" page.
let appPromise;

function loadApp() {
  if (!appPromise) {
    appPromise = import('../server/app.js').then((mod) => mod.default);
  }
  return appPromise;
}

function originalUrl(req) {
  const url = req.url || '/';

  // Some platforms replace req.url with the rewrite destination while keeping
  // the requested path in a header. Prefer the header when that happens.
  if (url === '/api/index' || url.startsWith('/api/index?') || url === '/api') {
    const forwarded = req.headers['x-forwarded-uri'];
    if (typeof forwarded === 'string' && forwarded.startsWith('/api')) {
      return forwarded;
    }
  }

  return url;
}

export default async function handler(req, res) {
  // Express expects the /api prefix that the rewrite may have dropped.
  const url = originalUrl(req);
  if (url !== '/api' && !url.startsWith('/api/')) {
    req.url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  } else {
    req.url = url;
  }

  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error) {
    console.error('API bootstrap failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: 'API failed to start',
        message: error?.message || String(error),
        code: error?.code || null,
      })
    );
  }
}