import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import { asInt, asNullableText, insertSql, updateSql } from './_helpers.js';

const router = Router();

function readInput(body, { partial = false } = {}) {
  const data = {};
  const text = { name: 120, role: 120, years: 60, bio: 2000, languages: 200, initials: 8, color: 20 };
  for (const [key, max] of Object.entries(text)) {
    if (body[key] !== undefined) data[key] = asNullableText(body[key], max);
  }
  if (body.sort_order !== undefined) data.sort_order = asInt(body.sort_order, 0);

  if (!partial) {
    if (!data.name) throw httpError(400, 'Name is required.');
    if (!data.role) data.role = 'Guide';
  }
  return data;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.guides order by sort_order, id');
    res.json({ success: true, guides: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = readInput(req.body);
    if (data.sort_order === undefined) {
      const next = await query('select coalesce(max(sort_order), -1) + 1 as next from public.guides');
      data.sort_order = next.rows[0].next;
    }
    const statement = insertSql('guides', data);
    const { rows } = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'create', entity: 'guide', entityId: rows[0].id });
    res.status(201).json({ success: true, guide: rows[0] });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = readInput(req.body, { partial: true });
    const statement = updateSql('guides', 'id', req.params.id, data);
    if (!statement) {
      const current = await query('select * from public.guides where id = $1', [req.params.id]);
      if (!current.rows[0]) throw httpError(404, 'Guide not found.');
      return res.json({ success: true, guide: current.rows[0] });
    }
    const { rows } = await query(statement.text, statement.values);
    if (!rows[0]) throw httpError(404, 'Guide not found.');
    await writeAudit(req, { action: 'update', entity: 'guide', entityId: req.params.id, diff: data });
    res.json({ success: true, guide: rows[0] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('delete from public.guides where id = $1 returning id', [
      req.params.id,
    ]);
    if (!rows[0]) throw httpError(404, 'Guide not found.');
    await writeAudit(req, { action: 'delete', entity: 'guide', entityId: req.params.id });
    res.json({ success: true });
  })
);

export default router;