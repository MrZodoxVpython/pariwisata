import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, cleanString } from '../../lib/http.js';
import { requireAdmin } from '../../middleware/admin.js';
import { dispatchQueued, queueReminders } from '../../lib/notifications.js';

const router = Router();

async function runDispatch() {
  const reminders = await queueReminders();
  const result = await dispatchQueued(50);
  return { reminders, ...result };
}

/**
 * Cron entry point. Accepts the Vercel cron secret (Vercel sends it as
 * "Authorization: Bearer <CRON_SECRET>"), an x-cron-secret header, or a
 * signed-in admin (so the button in the admin panel can trigger a flush).
 */
export async function dispatchHandler(req, res, next) {
  const secret = process.env.CRON_SECRET;
  const header = req.get('authorization') || '';
  const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  const provided = req.get('x-cron-secret') || bearer;

  if (secret && provided && provided === secret) {
    try {
      const result = await runDispatch();
      return res.json({ success: true, ...result });
    } catch (error) {
      return next(error);
    }
  }

  return requireAdmin(req, res, async (error) => {
    if (error) return next(error);
    try {
      const result = await runDispatch();
      return res.json({ success: true, ...result });
    } catch (inner) {
      return next(inner);
    }
  });
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = cleanString(req.query.status, 20);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 40));

    const params = [];
    let where = '';
    if (['queued', 'sent', 'failed', 'skipped'].includes(status)) {
      params.push(status);
      where = 'where status = $1';
    }

    const [count, data] = await Promise.all([
      query(`select count(*)::int as count from public.notifications ${where}`, params),
      query(
        `select * from public.notifications ${where}
         order by created_at desc
         limit $${params.length + 1} offset $${params.length + 2}`,
        [...params, limit, (page - 1) * limit]
      ),
    ]);

    res.json({ success: true, notifications: data.rows, total: count.rows[0].count, page, limit });
  })
);

router.post(
  '/:id/retry',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `update public.notifications
       set status = 'queued', attempts = 0, error = null
       where id = $1 returning *`,
      [req.params.id]
    );
    if (!rows[0]) {
      const error = new Error('Notification not found.');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, notification: rows[0] });
  })
);

export default router;