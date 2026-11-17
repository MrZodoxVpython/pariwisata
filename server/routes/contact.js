import { Router } from 'express';
import { query } from '../lib/db.js';
import { asyncHandler, httpError, isEmail, cleanString } from '../lib/http.js';
import { serializeContactMessage } from '../lib/serializers.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.post(
  '/',
  rateLimit({ max: 10, windowMs: 10 * 60 * 1000 }),
  asyncHandler(async (req, res) => {
    const name = cleanString(req.body.name, 120);
    const email = cleanString(req.body.email, 200);
    const whatsapp = cleanString(req.body.whatsapp, 40);
    const preferredDate = cleanString(req.body.preferredDate || req.body.date, 10);
    const peopleRaw = req.body.people;
    const people = peopleRaw === '' || peopleRaw == null ? null : Number(peopleRaw);
    const tourId = cleanString(req.body.tourId || req.body.tour, 80);
    const message = cleanString(req.body.message, 3000);

    const errors = [];
    if (!name) errors.push({ field: 'name', message: 'Name is required' });
    if (email && !isEmail(email)) errors.push({ field: 'email', message: 'Email is not valid' });
    if (!whatsapp || whatsapp.replace(/\D/g, '').length < 7) {
      errors.push({ field: 'whatsapp', message: 'A valid WhatsApp number is required' });
    }
    if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      errors.push({ field: 'preferredDate', message: 'Date is not valid' });
    }
    if (people !== null && (!Number.isInteger(people) || people < 1 || people > 8)) {
      errors.push({ field: 'people', message: 'Guests must be between 1 and 8' });
    }
    if (errors.length) throw httpError(400, 'Validation failed', errors);

    const { rows } = await query(
      `insert into public.contact_messages
        (name, email, whatsapp, preferred_date, people, tour_id, message)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning *`,
      [
        name,
        email || null,
        whatsapp,
        preferredDate || null,
        people,
        tourId || null,
        message || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Message received. We will get back to you shortly.',
      contact: serializeContactMessage(rows[0]),
    });
  })
);

router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from public.contact_messages order by created_at desc limit 500'
    );
    res.json({ success: true, messages: rows.map(serializeContactMessage) });
  })
);

export default router;