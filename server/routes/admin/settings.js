import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';
import { asBool, asNullableText, asText } from './_helpers.js';

const router = Router();

const FIELDS = {
  name: 160,
  url: 300,
  phone: 60,
  phone_href: 60,
  email: 200,
  address: 300,
  hours: 120,
  instagram: 300,
  facebook: 300,
  whatsapp: 300,
  currency: 10,
  announcement: 500,
  notify_email: 200,
  notify_whatsapp: 60,
  map_url: 500,
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.site_settings where id = 1');
    res.json({ success: true, settings: rows[0] || null });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const data = {};
    for (const [key, max] of Object.entries(FIELDS)) {
      if (req.body[key] !== undefined) data[key] = asNullableText(req.body[key], max);
    }
    if (req.body.announcement_active !== undefined) {
      data.announcement_active = asBool(req.body.announcement_active, false);
    }

    if (data.name !== undefined && !data.name) throw httpError(400, 'Site name is required.');
    if (data.url !== undefined && !data.url) throw httpError(400, 'Site URL is required.');

    if (!Object.keys(data).length) {
      const current = await query('select * from public.site_settings where id = 1');
      return res.json({ success: true, settings: current.rows[0] || null });
    }

    // Single-row table: UPDATE the existing row, and only INSERT when the row
    // is missing (a bare INSERT..ON CONFLICT would trip NOT NULL on `name`).
    const existing = await query('select id from public.site_settings where id = 1');
    let rows;

    if (existing.rows[0]) {
      const columns = Object.keys(data);
      const values = columns.map((column) => data[column]);
      values.push(1);
      const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
      const result = await query(
        `update public.site_settings set ${assignments.join(', ')}, updated_at = now()
         where id = $${values.length}
         returning *`,
        values
      );
      rows = result.rows;
    } else {
      const insertData = {
        id: 1,
        name: 'Canyoning Bali',
        url: 'https://canyoningbali.com/',
        ...data,
      };
      const columns = Object.keys(insertData);
      const values = columns.map((column) => insertData[column]);
      const result = await query(
        `insert into public.site_settings (${columns.join(', ')})
         values (${columns.map((_, index) => `$${index + 1}`).join(', ')})
         returning *`,
        values
      );
      rows = result.rows;
    }

    await writeAudit(req, { action: 'update', entity: 'site_settings', entityId: 1, diff: data });
    res.json({ success: true, settings: rows[0] });
  })
);

export default router;