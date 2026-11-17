import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import { asArray, asInt, asJson, asText, insertSql, slugify, updateSql } from './_helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.quiz_questions order by sort_order, id');
    res.json({ success: true, quiz: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const question = asText(req.body.question, 500);
    if (!question) throw httpError(400, 'Question is required.');

    const key = slugify(req.body.key || question, 'question');
    if ((await query('select 1 from public.quiz_questions where key = $1', [key])).rows[0]) {
      throw httpError(409, 'Question key already exists.');
    }

    let sortOrder = req.body.sort_order;
    if (sortOrder === undefined) {
      const next = await query(
        'select coalesce(max(sort_order), -1) + 1 as next from public.quiz_questions'
      );
      sortOrder = next.rows[0].next;
    }

    const statement = insertSql('quiz_questions', {
      key,
      question,
      options: asJson(req.body.options, []),
      sort_order: asInt(sortOrder, 0),
    });
    const { rows } = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'create', entity: 'quiz_question', entityId: rows[0].id });
    res.status(201).json({ success: true, question: rows[0] });
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
    if (req.body.key !== undefined) data.key = slugify(req.body.key, 'question');
    if (req.body.options !== undefined) data.options = asJson(req.body.options, []);
    if (req.body.sort_order !== undefined) data.sort_order = asInt(req.body.sort_order, 0);

    const statement = updateSql('quiz_questions', 'id', req.params.id, data);
    if (!statement) {
      const current = await query('select * from public.quiz_questions where id = $1', [req.params.id]);
      if (!current.rows[0]) throw httpError(404, 'Question not found.');
      return res.json({ success: true, question: current.rows[0] });
    }
    const { rows } = await query(statement.text, statement.values);
    if (!rows[0]) throw httpError(404, 'Question not found.');
    await writeAudit(req, { action: 'update', entity: 'quiz_question', entityId: req.params.id, diff: data });
    res.json({ success: true, question: rows[0] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('delete from public.quiz_questions where id = $1 returning id', [
      req.params.id,
    ]);
    if (!rows[0]) throw httpError(404, 'Question not found.');
    await writeAudit(req, { action: 'delete', entity: 'quiz_question', entityId: req.params.id });
    res.json({ success: true });
  })
);

router.post(
  '/reorder',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    await Promise.all(
      ids.map((id, index) =>
        query('update public.quiz_questions set sort_order = $1 where id = $2', [index, String(id)])
      )
    );
    res.json({ success: true });
  })
);

export default router;