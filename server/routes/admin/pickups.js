import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import { asBool, asInt, asText, insertSql, slugify, updateSql } from './_helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.pickups order by sort_order, label');
    res.json({ success: true, pickups: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const label = asText(req.body.label, 160);
    if (!label) throw httpError(400, 'Label is required.');
    const id = slugify(req.body.id || label, 'pickup');

    if ((await query('select 1 from public.pickups where id = $1', [id])).rows[0]) {
      throw httpError(409, 'Pickup id already exists.');
    }

    const next = await query('select coalesce(max(sort_order), -1) + 1 as next from public.pickups');
    const statement = insertSql('pickups', {
      id,
      label,
      fee: Math.max(0, asInt(req.body.fee, 0)),
      sort_order: asInt(req.body.sort_order, next.rows[0].next),
      active: asBool(req.body.active, true),
    });
    const { rows } = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'create', entity: 'pickup', entityId: id });
    res.status(201).json({ success: true, pickup: rows[0] });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = {};
    if (req.body.label !== undefined) {
      data.label = asText(req.body.label, 160);
      if (!data.label) throw httpError(400, 'Label is required.');
    }
    if (req.body.fee !== undefined) data.fee = Math.max(0, asInt(req.body.fee, 0));
    if (req.body.sort_order !== undefined) data.sort_order = asInt(req.body.sort_order, 0);
    if (req.body.active !== undefined) data.active = asBool(req.body.active, true);

    const statement = updateSql('pickups', 'id', req.params.id, data);
    if (!statement) {
      const current = await query('select * from public.pickups where id = $1', [req.params.id]);
      if (!current.rows[0]) throw httpError(404, 'Pickup not found.');
      return res.json({ success: true, pickup: current.rows[0] });
    }
    const { rows } = await query(statement.text, statement.values);
    if (!rows[0]) throw httpError(404, 'Pickup not found.');
    await writeAudit(req, { action: 'update', entity: 'pickup', entityId: req.params.id, diff: data });
    res.json({ success: true, pickup: rows[0] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'update public.pickups set active = false where id = $1 returning *',
      [req.params.id]
    );
    if (!rows[0]) throw httpError(404, 'Pickup not found.');
    await writeAudit(req, { action: 'delete', entity: 'pickup', entityId: req.params.id });
    res.json({ success: true, pickup: rows[0] });
  })
);

router.post(
  '/reorder',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    await Promise.all(
      ids.map((id, index) =>
        query('update public.pickups set sort_order = $1 where id = $2', [index, String(id)])
      )
    );
    res.json({ success: true });
  })
);

export default router;