import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import { asBool, asInt, asNullableText, asText, insertSql, updateSql } from './_helpers.js';

const router = Router();

function readInput(body, { partial = false } = {}) {
  const data = {};
  const text = { name: 120, country: 120, date_label: 60, tour: 120, source: 60, initials: 8, color: 20, quote: 2000 };
  for (const [key, max] of Object.entries(text)) {
    if (body[key] !== undefined) data[key] = asNullableText(body[key], max);
  }
  if (body.rating !== undefined) data.rating = Math.min(5, Math.max(1, asInt(body.rating, 5)));
  if (body.sort_order !== undefined) data.sort_order = asInt(body.sort_order, 0);
  if (body.published !== undefined) data.published = asBool(body.published, true);

  if (!partial) {
    if (!data.name) throw httpError(400, 'Name is required.');
    if (!data.country) throw httpError(400, 'Country is required.');
    if (!data.tour) throw httpError(400, 'Tour is required.');
    if (!data.quote) throw httpError(400, 'Quote is required.');
    if (data.rating === undefined) data.rating = 5;
    if (!data.date_label) data.date_label = new Date().toISOString().slice(0, 10);
    if (data.published === undefined) data.published = true;
  }
  return data;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.reviews order by sort_order, id');
    res.json({ success: true, reviews: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = readInput(req.body);
    if (data.sort_order === undefined) {
      const next = await query('select coalesce(max(sort_order), -1) + 1 as next from public.reviews');
      data.sort_order = next.rows[0].next;
    }
    const statement = insertSql('reviews', data);
    const { rows } = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'create', entity: 'review', entityId: rows[0].id });
    res.status(201).json({ success: true, review: rows[0] });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = readInput(req.body, { partial: true });
    const statement = updateSql('reviews', 'id', req.params.id, data);
    if (!statement) {
      const current = await query('select * from public.reviews where id = $1', [req.params.id]);
      if (!current.rows[0]) throw httpError(404, 'Review not found.');
      return res.json({ success: true, review: current.rows[0] });
    }
    const { rows } = await query(statement.text, statement.values);
    if (!rows[0]) throw httpError(404, 'Review not found.');
    await writeAudit(req, { action: 'update', entity: 'review', entityId: req.params.id, diff: data });
    res.json({ success: true, review: rows[0] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('delete from public.reviews where id = $1 returning id', [
      req.params.id,
    ]);
    if (!rows[0]) throw httpError(404, 'Review not found.');
    await writeAudit(req, { action: 'delete', entity: 'review', entityId: req.params.id });
    res.json({ success: true });
  })
);

export default router;