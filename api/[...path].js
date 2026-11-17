// Vercel serverless entry point. All /api/* requests are handled by the
// existing Express app.

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

export default async function handler(req, res) {
  // Some runtimes pass the path without the /api prefix, so normalise it
  // before handing the request to Express.
  const url = req.url || '/api';
  if (url !== '/api' && !url.startsWith('/api/')) {
    req.url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
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