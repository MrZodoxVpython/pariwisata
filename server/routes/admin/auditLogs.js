import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, cleanString } from '../../lib/http.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const clauses = [];
    const params = [];

    const entity = cleanString(req.query.entity, 60);
    const action = cleanString(req.query.action, 40);
    const actor = cleanString(req.query.actor, 200);
    const from = cleanString(req.query.from, 10);
    const to = cleanString(req.query.to, 10);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 40));

    if (entity) {
      params.push(entity);
      clauses.push(`entity = $${params.length}`);
    }
    if (action) {
      params.push(action);
      clauses.push(`action = $${params.length}`);
    }
    if (actor) {
      params.push(`%${actor}%`);
      clauses.push(`actor_email ilike $${params.length}`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      params.push(from);
      clauses.push(`created_at >= $${params.length}::date`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      params.push(to);
      clauses.push(`created_at < ($${params.length}::date + interval '1 day')`);
    }
    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';

    const [count, data] = await Promise.all([
      query(`select count(*)::int as count from public.audit_logs ${where}`, params),
      query(
        `select a.*, u.name as actor_name
         from public.audit_logs a
         left join public.admin_users u on u.id = a.actor_id
         ${where}
         order by a.created_at desc
         limit $${params.length + 1} offset $${params.length + 2}`,
        [...params, limit, (page - 1) * limit]
      ),
    ]);

    res.json({
      success: true,
      logs: data.rows.map((row) => ({
        id: row.id,
        actorEmail: row.actor_email,
        actorName: row.actor_name,
        action: row.action,
        entity: row.entity,
        entityId: row.entity_id,
        diff: row.diff,
        ip: row.ip,
        createdAt: row.created_at,
      })),
      total: count.rows[0].count,
      page,
      limit,
    });
  })
);

export default router;