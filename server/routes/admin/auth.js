import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError, isEmail, cleanString } from '../../lib/http.js';
import {
  hashPassword,
  isJwtConfigured,
  publicAdminUser,
  signToken,
  verifyPassword,
} from '../../lib/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { clearLoginFailures, loginRateLimit, recordLoginFailure } from '../../middleware/loginRateLimit.js';
import { writeAudit } from '../../lib/audit.js';

const router = Router();

router.post(
  '/login',
  loginRateLimit,
  asyncHandler(async (req, res) => {
    if (!isJwtConfigured()) {
      throw httpError(503, 'Admin login is disabled. Set ADMIN_JWT_SECRET on the server.');
    }

    const email = cleanString(req.body.email, 200).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!isEmail(email) || !password) {
      throw httpError(400, 'Enter a valid email and password.');
    }

    const { rows } = await query(
      `select id, email, name, password_hash, role, active, token_version
       from public.admin_users where email = $1`,
      [email]
    );
    const user = rows[0];

    if (!user || !user.active || !(await verifyPassword(password, user.password_hash))) {
      recordLoginFailure(req, email);
      throw httpError(401, 'Email or password is incorrect.');
    }

    clearLoginFailures(req, email);
    await query('update public.admin_users set last_login_at = now() where id = $1', [user.id]);

    req.admin = user;
    await writeAudit(req, { action: 'login', entity: 'admin_user', entityId: user.id });

    res.json({ success: true, token: signToken(user), user: publicAdminUser(user) });
  })
);

router.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ success: true, user: publicAdminUser(req.admin) });
  })
);

router.post(
  '/logout',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (req.body?.allDevices && req.admin?.id) {
      await query(
        'update public.admin_users set token_version = token_version + 1 where id = $1',
        [req.admin.id]
      );
    }
    await writeAudit(req, { action: 'logout', entity: 'admin_user', entityId: req.admin?.id || null });
    res.json({ success: true });
  })
);

router.post(
  '/password',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!req.admin?.id) throw httpError(400, 'Password changes need a signed-in account.');

    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

    if (newPassword.length < 8) {
      throw httpError(400, 'New password must be at least 8 characters.');
    }

    const { rows } = await query('select password_hash from public.admin_users where id = $1', [
      req.admin.id,
    ]);
    if (!rows[0] || !(await verifyPassword(currentPassword, rows[0].password_hash))) {
      throw httpError(400, 'Current password is incorrect.');
    }

    const hash = await hashPassword(newPassword);
    const updated = await query(
      `update public.admin_users
       set password_hash = $1, token_version = token_version + 1
       where id = $2
       returning id, email, name, role, active, token_version, last_login_at, created_at`,
      [hash, req.admin.id]
    );

    await writeAudit(req, { action: 'update', entity: 'admin_user', entityId: req.admin.id });
    res.json({
      success: true,
      token: signToken(updated.rows[0]),
      user: publicAdminUser(updated.rows[0]),
    });
  })
);

export default router;