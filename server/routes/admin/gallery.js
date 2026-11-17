import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import { asInt, asNullableText, asText, insertSql, updateSql } from './_helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.gallery order by sort_order, id');
    res.json({ success: true, gallery: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const id = asText(req.body.id, 1000);
    if (!id) throw httpError(400, 'Image id or URL is required.');

    if ((await query('select 1 from public.gallery where id = $1', [id])).rows[0]) {
      throw httpError(409, 'That image is already in the gallery.');
    }

    let sortOrder = req.body.sort_order;
    if (sortOrder === undefined) {
      const next = await query('select coalesce(max(sort_order), -1) + 1 as next from public.gallery');
      sortOrder = next.rows[0].next;
    }

    const statement = insertSql('gallery', {
      id,
      caption: asNullableText(req.body.caption, 200),
      alt: asNullableText(req.body.alt, 300),
      sort_order: asInt(sortOrder, 0),
    });
    const { rows } = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'create', entity: 'gallery', entityId: id });
    res.status(201).json({ success: true, image: rows[0] });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = {};
    if (req.body.caption !== undefined) data.caption = asNullableText(req.body.caption, 200);
    if (req.body.alt !== undefined) data.alt = asNullableText(req.body.alt, 300);
    if (req.body.sort_order !== undefined) data.sort_order = asInt(req.body.sort_order, 0);

    const statement = updateSql('gallery', 'id', req.params.id, data);
    if (!statement) {
      const current = await query('select * from public.gallery where id = $1', [req.params.id]);
      if (!current.rows[0]) throw httpError(404, 'Image not found.');
      return res.json({ success: true, image: current.rows[0] });
    }
    const { rows } = await query(statement.text, statement.values);
    if (!rows[0]) throw httpError(404, 'Image not found.');
    await writeAudit(req, { action: 'update', entity: 'gallery', entityId: req.params.id, diff: data });
    res.json({ success: true, image: rows[0] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const usedByTours = await query(
      'select id, name from public.tours where $1 = any(gallery_ids) limit 3',
      [req.params.id]
    );
    const usedByArticle = await query(
      'select slug, title from public.articles where image_id = $1 limit 3',
      [req.params.id]
    );

    if (usedByTours.rows.length || usedByArticle.rows.length) {
      const usage = [
        ...usedByTours.rows.map((row) => `tour "${row.name}"`),
        ...usedByArticle.rows.map((row) => `article "${row.title}"`),
      ].join(', ');
      throw httpError(409, `This image is still used by ${usage}.`);
    }

    const { rows } = await query('delete from public.gallery where id = $1 returning id', [
      req.params.id,
    ]);
    if (!rows[0]) throw httpError(404, 'Image not found.');
    await writeAudit(req, { action: 'delete', entity: 'gallery', entityId: req.params.id });
    res.json({ success: true });
  })
);

router.post(
  '/reorder',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    await Promise.all(
      ids.map((id, index) =>
        query('update public.gallery set sort_order = $1 where id = $2', [index, String(id)])
      )
    );
    res.json({ success: true });
  })
);

export default router;