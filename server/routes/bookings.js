import { Router } from 'express';
import { query, withTransaction } from '../lib/db.js';
import { asyncHandler, httpError, isEmail, cleanString } from '../lib/http.js';
import { serializeBooking } from '../lib/serializers.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { requireAdmin } from '../middleware/admin.js';
import { getAvailability } from '../lib/availability.js';
import { queueNotification } from '../lib/notifications.js';

const router = Router();
const MAX_PEOPLE = 8;

function validateBookingBody(body) {
  const errors = [];
  const tourId = cleanString(body.tourId || body.tour_id, 80);
  const pickupId = cleanString(body.pickupId || body.pickup_id, 80);
  const date = cleanString(body.date, 10);
  const people = Number(body.people);
  const name = cleanString(body.name, 120);
  const email = cleanString(body.email, 200);
  const whatsapp = cleanString(body.whatsapp, 40);
  const message = cleanString(body.message, 2000);

  if (!tourId) errors.push({ field: 'tourId', message: 'Tour is required' });
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    errors.push({ field: 'date', message: 'A valid date is required' });
  }
  if (!Number.isInteger(people) || people < 1 || people > MAX_PEOPLE) {
    errors.push({ field: 'people', message: `Guests must be between 1 and ${MAX_PEOPLE}` });
  }
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  if (email && !isEmail(email)) errors.push({ field: 'email', message: 'Email is not valid' });
  if (!whatsapp || whatsapp.replace(/\D/g, '').length < 7) {
    errors.push({ field: 'whatsapp', message: 'A valid WhatsApp number is required' });
  }

  return {
    value: { tourId, pickupId, date, people, name, email, whatsapp, message },
    errors,
  };
}

// POST /api/bookings — create a booking request
router.post(
  '/',
  rateLimit({ max: 10, windowMs: 10 * 60 * 1000 }),
  asyncHandler(async (req, res) => {
    const { value, errors } = validateBookingBody(req.body);
    if (errors.length) throw httpError(400, 'Validation failed', errors);

    if (value.date < new Date().toISOString().slice(0, 10)) {
      throw httpError(400, 'Validation failed', [
        { field: 'date', message: 'The date cannot be in the past' },
      ]);
    }

    const booking = await withTransaction(async (client) => {
      const tourResult = await client.query(
        'select id, name, price from public.tours where id = $1 and active = true',
        [value.tourId]
      );
      const tour = tourResult.rows[0];
      if (!tour) throw httpError(400, 'Validation failed', [{ field: 'tourId', message: 'Unknown tour' }]);

      const availability = await getAvailability(value.tourId, value.date, client.query.bind(client));
      if (!availability || !availability.available || availability.remaining < value.people) {
        throw httpError(400, 'Validation failed', [
          {
            field: 'date',
            message: !availability
              ? 'Unknown tour'
              : availability.isClosed
                ? 'That date is not available.'
                : `Only ${availability.remaining} spot(s) left on that date.`,
          },
        ]);
      }

      let pickup = null;
      if (value.pickupId) {
        const pickupResult = await client.query(
          'select id, label, fee from public.pickups where id = $1 and active = true',
          [value.pickupId]
        );
        pickup = pickupResult.rows[0];
        if (!pickup) {
          throw httpError(400, 'Validation failed', [{ field: 'pickupId', message: 'Unknown pickup point' }]);
        }
      }

      const subtotal = Number(tour.price) * value.people;
      const pickupFee = pickup ? Number(pickup.fee) : 0;
      const total = subtotal + pickupFee;

      const { rows } = await client.query(
        `insert into public.booking_requests
          (tour_id, tour_name, date, people, pickup_id, pickup_name, pickup_fee,
           subtotal, total, name, email, whatsapp, message, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending')
         returning *`,
        [
          tour.id,
          tour.name,
          value.date,
          value.people,
          pickup?.id || null,
          pickup?.label || null,
          pickupFee,
          subtotal,
          total,
          value.name,
          value.email || null,
          value.whatsapp,
          value.message || null,
        ]
      );

      return rows[0];
    });

    const serialized = serializeBooking(booking);

    const settings = await query('select notify_email, notify_whatsapp from public.site_settings where id = 1');
    if (settings.rows[0]?.notify_email) {
      await queueNotification({
        channel: 'email',
        recipient: settings.rows[0].notify_email,
        template: 'booking_created',
        payload: { booking: serialized },
      });
    }
    if (settings.rows[0]?.notify_whatsapp) {
      await queueNotification({
        channel: 'whatsapp',
        recipient: settings.rows[0].notify_whatsapp,
        template: 'booking_created',
        payload: { booking: serialized },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking request received. We will confirm availability via WhatsApp.',
      booking: serialized,
    });
  })
);

// GET /api/bookings — admin listing
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = cleanString(req.query.status, 20);
    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = 'where status = $1';
    }

    const { rows } = await query(
      `select * from public.booking_requests ${where} order by created_at desc limit 500`,
      params
    );
    res.json({ success: true, bookings: rows.map(serializeBooking) });
  })
);

// PATCH /api/bookings/:id — admin status update
router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = cleanString(req.body.status, 20);
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) throw httpError(400, 'Invalid status');

    const { rows } = await query(
      `update public.booking_requests
       set status = $1, updated_at = now()
       where id = $2
       returning *`,
      [status, req.params.id]
    );
    if (!rows[0]) throw httpError(404, 'Booking not found');
    res.json({ success: true, booking: serializeBooking(rows[0]) });
  })
);

export default router;