import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import {
  asArray,
  asBool,
  asInt,
  asJson,
  asNullableText,
  asText,
  insertSql,
  slugify,
  updateSql,
} from './_helpers.js';

const router = Router();

const TOUR_FIELDS = [
  'name',
  'short',
  'level',
  'level_key',
  'badge',
  'badge_class',
  'duration',
  'min_age',
  'max_weight',
  'swim',
  'jumps',
  'slides',
  'group_size',
  'price',
  'image',
  'gallery_ids',
  'best_for',
  'long_description',
  'itinerary',
  'inclusions',
  'exclusions',
  'requirements',
  'bring',
  'meeting',
  'cancellation',
  'sort_order',
  'active',
  'daily_capacity',
];

function readTourInput(body, { partial = false } = {}) {
  const data = {};
  const has = (key) => body[key] !== undefined;

  const text = {
    name: 160,
    short: 400,
    level: 60,
    level_key: 60,
    badge: 60,
    badge_class: 80,
    duration: 80,
    swim: 120,
    jumps: 120,
    slides: 120,
    group_size: 80,
    image: 500,
    best_for: 300,
    meeting: 500,
    cancellation: 1000,
  };

  for (const [key, max] of Object.entries(text)) {
    if (has(key)) data[key] = asNullableText(body[key], max);
  }
  if (has('long_description')) data.long_description = asNullableText(body.long_description, 8000);

  if (has('min_age')) data.min_age = Math.max(0, asInt(body.min_age, 8));
  if (has('max_weight')) data.max_weight = Math.max(0, asInt(body.max_weight, 120));
  if (has('price')) data.price = Math.max(0, asInt(body.price, 0));
  if (has('sort_order')) data.sort_order = asInt(body.sort_order, 0);
  if (has('active')) data.active = asBool(body.active, true);
  if (has('daily_capacity')) data.daily_capacity = Math.min(50, Math.max(0, asInt(body.daily_capacity, 8)));
  if (has('gallery_ids')) data.gallery_ids = asArray(body.gallery_ids);
  if (has('inclusions')) data.inclusions = asArray(body.inclusions);
  if (has('exclusions')) data.exclusions = asArray(body.exclusions);
  if (has('requirements')) data.requirements = asArray(body.requirements);
  if (has('bring')) data.bring = asArray(body.bring);
  if (has('itinerary')) data.itinerary = asJson(body.itinerary, []);

  if (!partial) {
    if (!data.name) throw httpError(400, 'Tour name is required.', [{ field: 'name', message: 'Required' }]);
    if (!data.short) throw httpError(400, 'Short description is required.', [{ field: 'short', message: 'Required' }]);
    if (!data.level) data.level = 'Beginner';
    if (!data.level_key) data.level_key = slugify(data.level, 'beginner');
    if (!data.duration) data.duration = 'Full day';
    if (!data.group_size) data.group_size = 'Max 8 guests';
    if (!data.swim) data.swim = 'Basic swimming required';
    if (data.min_age === undefined) data.min_age = 8;
    if (data.max_weight === undefined) data.max_weight = 120;
    if (data.price === undefined) data.price = 0;
    if (data.image === undefined || !data.image) data.image = '/assets/tours/aling.webp';
    if (data.itinerary === undefined) data.itinerary = [];
    if (data.inclusions === undefined) data.inclusions = [];
    if (data.exclusions === undefined) data.exclusions = [];
    if (data.requirements === undefined) data.requirements = [];
    if (data.bring === undefined) data.bring = [];
    if (data.active === undefined) data.active = true;
    if (data.daily_capacity === undefined) data.daily_capacity = 8;
  }

  return data;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.tours order by sort_order, name');
    res.json({ success: true, tours: rows });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.tours where id = $1', [req.params.id]);
    if (!rows[0]) throw httpError(404, 'Tour not found.');
    res.json({ success: true, tour: rows[0] });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = readTourInput(req.body);
    const id = slugify(req.body.id || data.name, 'tour');

    const exists = await query('select 1 from public.tours where id = $1', [id]);
    if (exists.rows[0]) throw httpError(409, `Tour id "${id}" already exists.`);

    if (data.sort_order === undefined) {
      const next = await query('select coalesce(max(sort_order), -1) + 1 as next from public.tours');
      data.sort_order = next.rows[0].next;
    }
    data.id = id;
    data.updated_by = req.admin?.id || null;

    const statement = insertSql('tours', data);
    const { rows } = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'create', entity: 'tour', entityId: id, diff: data });
    res.status(201).json({ success: true, tour: rows[0] });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const current = await query('select * from public.tours where id = $1', [req.params.id]);
    if (!current.rows[0]) throw httpError(404, 'Tour not found.');

    const data = readTourInput(req.body, { partial: true });
    data.updated_by = req.admin?.id || null;

    const statement = updateSql('tours', 'id', req.params.id, data);
    if (!statement) {
      return res.json({ success: true, tour: current.rows[0] });
    }
    const { rows } = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'update', entity: 'tour', entityId: req.params.id, diff: data });
    res.json({ success: true, tour: rows[0] });
  })
);

router.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.tours where id = $1', [req.params.id]);
    const source = rows[0];
    if (!source) throw httpError(404, 'Tour not found.');

    let suffix = 2;
    let newId = `${source.id}-copy`;
    while ((await query('select 1 from public.tours where id = $1', [newId])).rows[0]) {
      newId = `${source.id}-copy-${suffix}`;
      suffix += 1;
    }

    const next = await query('select coalesce(max(sort_order), -1) + 1 as next from public.tours');
    const copy = { ...source };
    delete copy.created_at;
    delete copy.updated_at;
    copy.id = newId;
    copy.name = `${source.name} (copy)`;
    copy.sort_order = next.rows[0].next;
    copy.active = false;
    copy.updated_by = req.admin?.id || null;

    const statement = insertSql('tours', copy);
    const inserted = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'create', entity: 'tour', entityId: newId, diff: { copiedFrom: source.id } });
    res.status(201).json({ success: true, tour: inserted.rows[0] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `update public.tours set active = false, updated_by = $2 where id = $1 returning *`,
      [req.params.id, req.admin?.id || null]
    );
    if (!rows[0]) throw httpError(404, 'Tour not found.');
    await writeAudit(req, { action: 'delete', entity: 'tour', entityId: req.params.id });
    res.json({ success: true, tour: rows[0] });
  })
);

router.post(
  '/reorder',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    await Promise.all(
      ids.map((id, index) =>
        query('update public.tours set sort_order = $1 where id = $2', [index, String(id)])
      )
    );
    await writeAudit(req, { action: 'update', entity: 'tour', diff: { reorder: ids } });
    res.json({ success: true });
  })
);

export default router;