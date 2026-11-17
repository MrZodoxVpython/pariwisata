import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import { asBool, asInt, asNullableText, asText, insertSql, updateSql } from './_helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.faqs order by sort_order, id');
    res.json({ success: true, faqs: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const question = asText(req.body.question, 500);
    const answer = asText(req.body.answer, 5000);
    if (!question) throw httpError(400, 'Question is required.');
    if (!answer) throw httpError(400, 'Answer is required.');

    let sortOrder = req.body.sort_order;
    if (sortOrder === undefined) {
      const next = await query('select coalesce(max(sort_order), -1) + 1 as next from public.faqs');
      sortOrder = next.rows[0].next;
    }

    const statement = insertSql('faqs', {
      question,
      answer,
      sort_order: asInt(sortOrder, 0),
      published: asBool(req.body.published, true),
    });
    const { rows } = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'create', entity: 'faq', entityId: rows[0].id });
    res.status(201).json({ success: true, faq: rows[0] });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = {};
    if (req.body.question !== undefined) {
      data.question = asText(req.body.question, 500);
      if (!data.question) throw httpError(400, 'Question is required.');
    }
    if (req.body.answer !== undefined) {
      data.answer = asText(req.body.answer, 5000);
      if (!data.answer) throw httpError(400, 'Answer is required.');
    }
    if (req.body.sort_order !== undefined) data.sort_order = asInt(req.body.sort_order, 0);
    if (req.body.published !== undefined) data.published = asBool(req.body.published, true);

    const statement = updateSql('faqs', 'id', req.params.id, data);
    if (!statement) {
      const current = await query('select * from public.faqs where id = $1', [req.params.id]);
      if (!current.rows[0]) throw httpError(404, 'FAQ not found.');
      return res.json({ success: true, faq: current.rows[0] });
    }
    const { rows } = await query(statement.text, statement.values);
    if (!rows[0]) throw httpError(404, 'FAQ not found.');
    await writeAudit(req, { action: 'update', entity: 'faq', entityId: req.params.id, diff: data });
    res.json({ success: true, faq: rows[0] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('delete from public.faqs where id = $1 returning id', [req.params.id]);
    if (!rows[0]) throw httpError(404, 'FAQ not found.');
    await writeAudit(req, { action: 'delete', entity: 'faq', entityId: req.params.id });
    res.json({ success: true });
  })
);

router.post(
  '/reorder',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    await Promise.all(
      ids.map((id, index) =>
        query('update public.faqs set sort_order = $1 where id = $2', [index, String(id)])
      )
    );
    res.json({ success: true });
  })
);

export default router;