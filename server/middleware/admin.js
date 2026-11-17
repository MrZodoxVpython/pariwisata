import { httpError } from '../lib/http.js';

export function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return next(httpError(503, 'Admin API is disabled. Set ADMIN_TOKEN on the server.'));
  }

  const provided = req.get('x-admin-token') || '';
  if (provided !== expected) {
    return next(httpError(401, 'Unauthorized'));
  }

  return next();
}