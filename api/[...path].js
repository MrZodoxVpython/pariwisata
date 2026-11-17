import app from '../server/app.js';

// Vercel serverless entry point. All /api/* requests are handled by the
// existing Express app. Some runtimes pass the path without the /api prefix,
// so normalise it before handing the request to Express.
export default function handler(req, res) {
  const url = req.url || '/api';
  if (url !== '/api' && !url.startsWith('/api/')) {
    req.url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return app(req, res);
}