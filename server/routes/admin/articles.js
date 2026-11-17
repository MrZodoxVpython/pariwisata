import { Router } from 'express';
import sanitizeHtml from 'sanitize-html';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import { asBool, asInt, asNullableText, asText, insertSql, slugify, updateSql } from './_helpers.js';

const router = Router();

const SANITIZE = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

function sanitize(html) {
  return sanitizeHtml(String(html || ''), SANITIZE);
}

function readInput(body, { partial = false } = {}) {
  const data = {};
  if (body.kicker !== undefined) data.kicker = asNullableText(body.kicker, 120);
  if (body.title !== undefined) data.title = asText(body.title, 200);
  if (body.meta !== undefined) data.meta = asNullableText(body.meta, 300);
  if (body.image_id !== undefined) data.image_id = asNullableText(body.image_id, 500);
  if (body.body !== undefined) data.body = sanitize(body.body).slice(0, 100000);
  if (body.sort_order !== undefined) data.sort_order = asInt(body.sort_order, 0);
  if (body.published !== undefined) data.published = asBool(body.published, true);

  if (!partial) {
    if (!data.title) throw httpError(400, 'Title is required.');
    if (!data.body) throw httpError(400, 'Article body is required.');
    if (data.published === undefined) data.published = false;
    if (!data.meta) {
      data.meta = `${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · 5 min read`;
    }
  }
  return data;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select * from public.articles order by sort_order, title`
    );
    res.json({ success: true, articles: rows });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.articles where slug = $1', [req.params.slug]);
    if (!rows[0]) throw httpError(404, 'Article not found.');
    res.json({ success: true, article: rows[0] });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = readInput(req.body);
    const slug = slugify(req.body.slug || data.title, 'article');
    if ((await query('select 1 from public.articles where slug = $1', [slug])).rows[0]) {
      throw httpError(409, 'Article slug already exists.');
    }
    if (data.sort_order === undefined) {
      const next = await query('select coalesce(max(sort_order), -1) + 1 as next from public.articles');
      data.sort_order = next.rows[0].next;
    }
    data.slug = slug;

    const statement = insertSql('articles', data);
    const { rows } = await query(statement.text, statement.values);
    await writeAudit(req, { action: 'create', entity: 'article', entityId: slug });
    res.status(201).json({ success: true, article: rows[0] });
  })
);

router.patch(
  '/:slug',
  asyncHandler(async (req, res) => {
    const data = readInput(req.body, { partial: true });
    if (data.title !== undefined && !data.title) throw httpError(400, 'Title is required.');
    if (data.body !== undefined && !data.body) throw httpError(400, 'Article body is required.');

    const statement = updateSql('articles', 'slug', req.params.slug, data);
    if (!statement) {
      const current = await query('select * from public.articles where slug = $1', [req.params.slug]);
      if (!current.rows[0]) throw httpError(404, 'Article not found.');
      return res.json({ success: true, article: current.rows[0] });
    }
    const { rows } = await query(statement.text, statement.values);
    if (!rows[0]) throw httpError(404, 'Article not found.');
    await writeAudit(req, { action: 'update', entity: 'article', entityId: req.params.slug, diff: data });
    res.json({ success: true, article: rows[0] });
  })
);

router.post(
  '/:slug/publish',
  asyncHandler(async (req, res) => {
    const published = asBool(req.body.published, true);
    const { rows } = await query(
      'update public.articles set published = $1 where slug = $2 returning *',
      [published, req.params.slug]
    );
    if (!rows[0]) throw httpError(404, 'Article not found.');
    await writeAudit(req, {
      action: 'update',
      entity: 'article',
      entityId: req.params.slug,
      diff: { published },
    });
    res.json({ success: true, article: rows[0] });
  })
);

router.delete(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { rows } = await query('delete from public.articles where slug = $1 returning slug', [
      req.params.slug,
    ]);
    if (!rows[0]) throw httpError(404, 'Article not found.');
    await writeAudit(req, { action: 'delete', entity: 'article', entityId: req.params.slug });
    res.json({ success: true });
  })
);

router.post(
  '/reorder',
  asyncHandler(async (req, res) => {
    const slugs = Array.isArray(req.body.slugs) ? req.body.slugs : [];
    await Promise.all(
      slugs.map((slug, index) =>
        query('update public.articles set sort_order = $1 where slug = $2', [index, String(slug)])
      )
    );
    res.json({ success: true });
  })
);

export default router;