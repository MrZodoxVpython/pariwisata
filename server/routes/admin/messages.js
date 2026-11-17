import { Router } from 'express';
import { query, withTransaction } from '../../lib/db.js';
import { asyncHandler, httpError, cleanString } from '../../lib/http.js';
import { serializeContactMessage, serializeBooking } from '../../lib/serializers.js';
import { getAvailability } from '../../lib/availability.js';
import { writeAudit } from '../../lib/audit.js';

const router = Router();
const STATUSES = ['new', 'read', 'replied', 'archived'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = cleanString(req.query.status, 20);
    const term = cleanString(req.query.q, 120);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 25));

    const clauses = [];
    const params = [];
    if (STATUSES.includes(status)) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    if (term) {
      params.push(`%${term}%`);
      clauses.push(
        `(name ilike $${params.length} or email ilike $${params.length} or whatsapp ilike $${params.length} or message ilike $${params.length})`
      );
    }
    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';

    const [count, data] = await Promise.all([
      query(`select count(*)::int as count from public.contact_messages ${where}`, params),
      query(
        `select * from public.contact_messages ${where}
         order by created_at desc
         limit $${params.length + 1} offset $${params.length + 2}`,
        [...params, limit, (page - 1) * limit]
      ),
    ]);

    res.json({
      success: true,
      messages: data.rows.map(serializeContactMessage),
      total: count.rows[0].count,
      page,
      limit,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.contact_messages where id = $1', [
      req.params.id,
    ]);
    if (!rows[0]) throw httpError(404, 'Message not found.');
    res.json({
      success: true,
      message: {
        ...serializeContactMessage(rows[0]),
        adminNotes: rows[0].admin_notes,
        repliedAt: rows[0].replied_at,
      },
    });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const status = cleanString(req.body.status, 20);
    if (!STATUSES.includes(status)) throw httpError(400, 'Invalid status.');

    const adminNotes =
      req.body.admin_notes !== undefined || req.body.adminNotes !== undefined
        ? cleanString(req.body.admin_notes ?? req.body.adminNotes, 2000) || null
        : undefined;

    const replied = status === 'replied';
    const { rows } = await query(
      `update public.contact_messages
       set status = $1,
           admin_notes = coalesce($2, admin_notes),
           replied_at = case when $3 then now() else replied_at end,
           replied_by = case when $3 then $4 else replied_by end
       where id = $5
       returning *`,
      [status, adminNotes === undefined ? null : adminNotes, replied, req.admin?.id || null, req.params.id]
    );
    if (!rows[0]) throw httpError(404, 'Message not found.');

    await writeAudit(req, {
      action: 'update',
      entity: 'contact_message',
      entityId: req.params.id,
      diff: { status },
    });

    res.json({ success: true, message: serializeContactMessage(rows[0]) });
  })
);

router.post(
  '/:id/convert-to-booking',
  asyncHandler(async (req, res) => {
    const messageResult = await query('select * from public.contact_messages where id = $1', [
      req.params.id,
    ]);
    const message = messageResult.rows[0];
    if (!message) throw httpError(404, 'Message not found.');

    const tourId = cleanString(req.body.tour_id || req.body.tourId || message.tour_id, 80);
    const date = cleanString(req.body.date || message.preferred_date, 10);
    const people = Number(req.body.people || message.people || 1);
    const pickupId = cleanString(req.body.pickup_id || req.body.pickupId, 80);

    if (!tourId) throw httpError(400, 'Choose a tour first.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw httpError(400, 'Choose a valid date.');
    if (!Number.isInteger(people) || people < 1 || people > 8) {
      throw httpError(400, 'Guests must be 1–8.');
    }

    const booking = await withTransaction(async (client) => {
      const tourResult = await client.query(
        'select id, name, price from public.tours where id = $1',
        [tourId]
      );
      const tour = tourResult.rows[0];
      if (!tour) throw httpError(400, 'Tour not found.');

      let pickup = null;
      if (pickupId) {
        const pickupResult = await client.query(
          'select id, label, fee from public.pickups where id = $1',
          [pickupId]
        );
        pickup = pickupResult.rows[0];
        if (!pickup) throw httpError(400, 'Pickup point not found.');
      }

      const availability = await getAvailability(tourId, date, client.query.bind(client));
      if (!availability || !availability.available || availability.remaining < people) {
        throw httpError(400, 'No availability for that date.');
      }

      const subtotal = Number(tour.price) * people;
      const pickupFee = pickup ? Number(pickup.fee) : 0;

      const inserted = await client.query(
        `insert into public.booking_requests
          (tour_id, tour_name, date, people, pickup_id, pickup_name, pickup_fee,
           subtotal, total, name, email, whatsapp, message, status, source, updated_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending','admin',$14)
         returning *`,
        [
          tour.id,
          tour.name,
          date,
          people,
          pickup?.id || null,
          pickup?.label || null,
          pickupFee,
          subtotal,
          subtotal + pickupFee,
          message.name,
          message.email,
          message.whatsapp,
          message.message,
          req.admin?.id || null,
        ]
      );

      await client.query(
        `insert into public.booking_status_history (booking_id, from_status, to_status, changed_by, note)
         values ($1, null, 'pending', $2, 'Converted from contact message')`,
        [inserted.rows[0].id, req.admin?.id || null]
      );

      await client.query(
        `update public.contact_messages
         set status = 'replied', replied_at = now(), replied_by = $2
         where id = $1`,
        [message.id, req.admin?.id || null]
      );

      return inserted.rows[0];
    });

    await writeAudit(req, {
      action: 'create',
      entity: 'booking',
      entityId: booking.id,
      diff: { fromContactMessage: message.id },
    });

    res.status(201).json({ success: true, booking: serializeBooking(booking) });
  })
);

export default router;