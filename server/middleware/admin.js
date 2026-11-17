import { httpError } from '../lib/http.js';
import { decodeToken, isJwtConfigured, loadAdminFromPayload } from '../lib/auth.js';

/**
 * Accepts either:
 *  - Authorization: Bearer <JWT>  (admin panel)
 *  - x-admin-token: <ADMIN_TOKEN> (legacy scripts / curl)
 */
export function requireAdmin(req, res, next) {
  Promise.resolve()
    .then(async () => {
      const header = req.get('authorization') || '';
      if (header.toLowerCase().startsWith('bearer ')) {
        if (!isJwtConfigured()) {
          throw httpError(503, 'Admin login is disabled. Set ADMIN_JWT_SECRET on the server.');
        }
        const payload = decodeToken(header.slice(7).trim());
        if (!payload) throw httpError(401, 'Unauthorized');
        const user = await loadAdminFromPayload(payload);
        if (!user) throw httpError(401, 'Session expired. Please sign in again.');
        req.admin = user;
        return next();
      }

      const expected = process.env.ADMIN_TOKEN;
      const provided = req.get('x-admin-token') || '';
      if (expected && provided && provided === expected) {
        req.admin = {
          id: null,
          email: 'legacy-token',
          name: 'Legacy token',
          role: 'owner',
          legacy: true,
        };
        return next();
      }

      if (!expected && !isJwtConfigured()) {
        throw httpError(503, 'Admin API is disabled. Set ADMIN_TOKEN or ADMIN_JWT_SECRET.');
      }
      throw httpError(401, 'Unauthorized');
    })
    .catch(next);
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) return next(httpError(401, 'Unauthorized'));
    if (!roles.includes(req.admin.role)) {
      return next(httpError(403, 'Your role does not allow this action.'));
    }
    return next();
  };
}