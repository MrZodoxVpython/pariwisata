import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError, isEmail, cleanString } from '../../lib/http.js';
import { hashPassword, publicAdminUser, ROLES } from '../../lib/auth.js';
import { writeAudit } from '../../lib/audit.js';

const router = Router();

async function activeOwners(excludeId = null) {
  const { rows } = await query(
    `select count(*)::int as count from public.admin_users
     where role = 'owner' and active = true and ($1::uuid is null or id <> $1::uuid)`,
    [excludeId]
  );
  return rows[0].count;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select id, email, name, role, active, last_login_at, created_at, updated_at
       from public.admin_users order by created_at`
    );
    res.json({ success: true, users: rows.map(publicAdminUser) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const email = cleanString(req.body.email, 200).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const name = cleanString(req.body.name, 120) || email.split('@')[0];
    const role = ROLES.includes(req.body.role) ? req.body.role : 'staff';

    if (!isEmail(email)) throw httpError(400, 'A valid email is required.');
    if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters.');
    if ((await query('select 1 from public.admin_users where email = $1', [email])).rows[0]) {
      throw httpError(409, 'An account with that email already exists.');
    }

    const hash = await hashPassword(password);
    const { rows } = await query(
      `insert into public.admin_users (email, password_hash, name, role)
       values ($1, $2, $3, $4)
       returning id, email, name, role, active, last_login_at, created_at`,
      [email, hash, name, role]
    );

    await writeAudit(req, { action: 'create', entity: 'admin_user', entityId: rows[0].id });
    res.status(201).json({ success: true, user: publicAdminUser(rows[0]) });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const current = await query('select * from public.admin_users where id = $1', [req.params.id]);
    const user = current.rows[0];
    if (!user) throw httpError(404, 'User not found.');

    if (req.params.id === req.admin?.id && (req.body.active === false || (req.body.role && req.body.role !== 'owner' && user.role === 'owner'))) {
      throw httpError(400, 'You cannot deactivate or demote your own owner account.');
    }

    const data = {};
    if (req.body.name !== undefined) data.name = cleanString(req.body.name, 120) || user.name;
    if (req.body.role !== undefined) {
      if (!ROLES.includes(req.body.role)) throw httpError(400, 'Invalid role.');
      data.role = req.body.role;
    }
    if (req.body.active !== undefined) data.active = Boolean(req.body.active);

    const nextRole = data.role ?? user.role;
    const nextActive = data.active ?? user.active;
    if (user.role === 'owner' && user.active && (nextRole !== 'owner' || !nextActive)) {
      if ((await activeOwners(user.id)) === 0) {
        throw httpError(400, 'At least one active owner is required.');
      }
    }

    if (req.body.password !== undefined) {
      const password = String(req.body.password || '');
      if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters.');
      data.password_hash = await hashPassword(password);
      data.token_version = Number(user.token_version) + 1;
    }

    if (!Object.keys(data).length) return res.json({ success: true, user: publicAdminUser(user) });

    const columns = Object.keys(data);
    const values = columns.map((column) => data[column]);
    values.push(req.params.id);
    const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
    const { rows } = await query(
      `update public.admin_users set ${assignments.join(', ')} where id = $${values.length}
       returning id, email, name, role, active, last_login_at, created_at, updated_at`,
      values
    );

    await writeAudit(req, { action: 'update', entity: 'admin_user', entityId: req.params.id, diff: { ...data, password_hash: undefined } });
    res.json({ success: true, user: publicAdminUser(rows[0]) });
  })
);

router.post(
  '/:id/reset-password',
  asyncHandler(async (req, res) => {
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters.');
    const hash = await hashPassword(password);

    const { rows } = await query(
      `update public.admin_users
       set password_hash = $1, token_version = token_version + 1
       where id = $2
       returning id, email, name, role, active, created_at`,
      [hash, req.params.id]
    );
    if (!rows[0]) throw httpError(404, 'User not found.');
    await writeAudit(req, { action: 'update', entity: 'admin_user', entityId: req.params.id, diff: { password: 'reset' } });
    res.json({ success: true, user: publicAdminUser(rows[0]) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === req.admin?.id) throw httpError(400, 'You cannot delete your own account.');

    const current = await query('select * from public.admin_users where id = $1', [req.params.id]);
    const user = current.rows[0];
    if (!user) throw httpError(404, 'User not found.');
    if (user.role === 'owner' && user.active && (await activeOwners(user.id)) === 0) {
      throw httpError(400, 'At least one active owner is required.');
    }

    await query('delete from public.admin_users where id = $1', [req.params.id]);
    await writeAudit(req, { action: 'delete', entity: 'admin_user', entityId: req.params.id });
    res.json({ success: true });
  })
);

export default router;