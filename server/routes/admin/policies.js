import { Router } from 'express';
import sanitizeHtml from 'sanitize-html';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import { asText } from './_helpers.js';

const router = Router();

const SANITIZE = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div',
  ],
  allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.policies order by slug');
    res.json({ success: true, policies: rows });
  })
);

router.put(
  '/:slug',
  asyncHandler(async (req, res) => {
    const slug = asText(req.params.slug, 80);
    if (!['privacy', 'terms', 'cancellation'].includes(slug)) {
      throw httpError(400, 'Unknown policy.');
    }
    const title = asText(req.body.title, 200);
    const html = sanitizeHtml(String(req.body.html || ''), SANITIZE);
    if (!title) throw httpError(400, 'Title is required.');
    if (!html) throw httpError(400, 'Policy content is required.');

    const { rows } = await query(
      `insert into public.policies (slug, title, html, updated_at)
       values ($1, $2, $3, now())
       on conflict (slug) do update set
         title = excluded.title,
         html = excluded.html,
         updated_at = now()
       returning *`,
      [slug, title, html]
    );

    await writeAudit(req, { action: 'update', entity: 'policy', entityId: slug });
    res.json({ success: true, policy: rows[0] });
  })
);

export default router;