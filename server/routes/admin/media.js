import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError, cleanString } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import {
  createSignedUpload,
  getPublicUrl,
  isStorageConfigured,
  removeObject,
  storageBucket,
} from '../../lib/storage.js';

const router = Router();

function safeName(filename, contentType) {
  const extensionFromMime = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  }[contentType];
  const ext = extensionFromMime || path.extname(filename || '').replace('.', '').slice(0, 6) || 'bin';
  const base = path
    .basename(filename || 'upload', path.extname(filename || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || 'upload'}-${randomUUID().slice(0, 8)}.${ext}`;
}

router.get(
  '/config',
  asyncHandler(async (req, res) => {
    res.json({ success: true, configured: isStorageConfigured(), bucket: storageBucket() });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 40));
    const term = cleanString(req.query.q, 100);
    const params = [];
    let where = '';
    if (term) {
      params.push(`%${term}%`);
      where = `where caption ilike $1 or alt ilike $1 or path ilike $1`;
    }
    const [count, data] = await Promise.all([
      query(`select count(*)::int as count from public.media ${where}`, params),
      query(
        `select * from public.media ${where} order by created_at desc
         limit $${params.length + 1} offset $${params.length + 2}`,
        [...params, limit, (page - 1) * limit]
      ),
    ]);
    res.json({ success: true, media: data.rows, total: count.rows[0].count, page, limit });
  })
);

router.post(
  '/sign',
  asyncHandler(async (req, res) => {
    if (!isStorageConfigured()) {
      throw httpError(503, 'Object storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    const filename = cleanString(req.body.filename, 200);
    const contentType = cleanString(req.body.contentType, 100) || 'application/octet-stream';
    if (!/^image\//.test(contentType)) throw httpError(400, 'Only image uploads are supported.');

    const now = new Date();
    const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const objectPath = `${folder}/${safeName(filename, contentType)}`;
    const signed = await createSignedUpload(objectPath);
    res.json({ success: true, ...signed });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const objectPath = cleanString(req.body.path, 500);
    if (!objectPath) throw httpError(400, 'Upload path is required.');
    const url = cleanString(req.body.url, 1000) || getPublicUrl(objectPath);
    if (!url) throw httpError(503, 'Object storage is not configured.');

    const { rows } = await query(
      `insert into public.media
        (path, url, mime, size_bytes, width, height, alt, caption, uploaded_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning *`,
      [
        objectPath,
        url,
        cleanString(req.body.mime, 100) || null,
        Number(req.body.size) || null,
        Number(req.body.width) || null,
        Number(req.body.height) || null,
        cleanString(req.body.alt, 300) || null,
        cleanString(req.body.caption, 300) || null,
        req.admin?.id || null,
      ]
    );

    await writeAudit(req, { action: 'create', entity: 'media', entityId: rows[0].id });
    res.status(201).json({ success: true, media: rows[0] });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `update public.media set alt = coalesce($1, alt), caption = coalesce($2, caption)
       where id = $3 returning *`,
      [
        cleanString(req.body.alt, 300) || null,
        cleanString(req.body.caption, 300) || null,
        req.params.id,
      ]
    );
    if (!rows[0]) throw httpError(404, 'Media not found.');
    res.json({ success: true, media: rows[0] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.media where id = $1', [req.params.id]);
    const item = rows[0];
    if (!item) throw httpError(404, 'Media not found.');

    const used = await query('select 1 from public.gallery where id = $1', [item.url]);
    if (used.rows[0]) throw httpError(409, 'This image is still used in the gallery.');

    await removeObject(item.path);
    await query('delete from public.media where id = $1', [req.params.id]);
    await writeAudit(req, { action: 'delete', entity: 'media', entityId: req.params.id });
    res.json({ success: true });
  })
);

export default router;