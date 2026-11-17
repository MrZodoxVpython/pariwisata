import { Router } from 'express';
import { query, withTransaction } from '../../lib/db.js';
import { asyncHandler, httpError, isEmail, cleanString } from '../../lib/http.js';
import { serializeBooking } from '../../lib/serializers.js';
import { getAvailability } from '../../lib/availability.js';
import { writeAudit } from '../../lib/audit.js';
import { toCsv, sendCsv } from '../../lib/csv.js';
import { queueNotification } from '../../lib/notifications.js';

const router = Router();
const MAX_PEOPLE = 8;
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: ['confirmed'],
  cancelled: ['pending'],
};

const SORTABLE = {
  created_at: 'created_at',
  date: 'date',
  total: 'total',
  name: 'name',
  status: 'status',
};

function cleanInt(value, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}

function cleanDate(value) {
  const date = cleanString(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return null;
  return date;
}

function cleanEmail(value) {
  const email = cleanString(value, 200);
  if (email && !isEmail(email)) return null;
  return email;
}

/** Capacity check that ignores the booking being edited. */
async function assertCapacity(executor, { tourId, date, people, excludeId = null, onlyIfNeeded = true }) {
  const tourResult = await executor('select id, daily_capacity from public.tours where id = $1', [tourId]);
  const tour = tourResult.rows[0];
  if (!tour) throw httpError(400, 'Tour not found.');

  const overrideResult = await executor(
    'select capacity, is_closed from public.tour_availability where tour_id = $1 and date = $2',
    [tourId, date]
  );
  const override = overrideResult.rows[0];
  const capacity = override ? Number(override.capacity) : Number(tour.daily_capacity ?? 8);
  const closed = Boolean(override?.is_closed);

  const bookedResult = await executor(
    `select coalesce(sum(people), 0)::int as booked
     from public.booking_requests
     where tour_id = $1 and date = $2
       and status = any($3::text[])
       and ($4::uuid is null or id <> $4::uuid)`,
    [tourId, date, ['pending', 'confirmed', 'completed'], excludeId]
  );
  const booked = Number(bookedResult.rows[0]?.booked || 0);

  if (closed || booked + people > capacity) {
    throw httpError(400, 'No availability for that date.', [
      {
        field: 'date',
        message: closed
          ? 'That date is closed for this tour.'
          : `Only ${Math.max(0, capacity - booked)} spot(s) left on that date.`,
      },
    ]);
  }

  if (!onlyIfNeeded) return { capacity, booked };
  return { capacity, booked };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const clauses = [];
    const params = [];

    const status = cleanString(req.query.status, 20);
    const tourId = cleanString(req.query.tourId, 80);
    const from = cleanDate(req.query.from);
    const to = cleanDate(req.query.to);
    const term = cleanString(req.query.q, 120);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 25));
    const sortKey = SORTABLE[req.query.sort] || 'created_at';
    const sortDir = req.query.dir === 'asc' ? 'asc' : 'desc';

    if (status && STATUSES.includes(status)) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    if (tourId) {
      params.push(tourId);
      clauses.push(`tour_id = $${params.length}`);
    }
    if (from) {
      params.push(from);
      clauses.push(`date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      clauses.push(`date <= $${params.length}`);
    }
    if (term) {
      params.push(`%${term}%`);
      clauses.push(
        `(name ilike $${params.length} or email ilike $${params.length} or whatsapp ilike $${params.length} or tour_name ilike $${params.length} or cast(id as text) ilike $${params.length})`
      );
    }

    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
    const totalResult = await query(
      `select count(*)::int as count from public.booking_requests ${where}`,
      params
    );

    const dataParams = [...params, limit, (page - 1) * limit];
    const { rows } = await query(
      `select * from public.booking_requests ${where}
       order by ${sortKey} ${sortDir} nulls last
       limit $${params.length + 1} offset $${params.length + 2}`,
      dataParams
    );

    res.json({
      success: true,
      bookings: rows.map(serializeBooking),
      total: totalResult.rows[0].count,
      page,
      limit,
    });
  })
);

router.get(
  '/export.csv',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select * from public.booking_requests order by created_at desc limit 5000`
    );
    const bookings = rows.map(serializeBooking);
    const csv = toCsv(
      [
        { label: 'ID', key: 'id' },
        { label: 'Created', key: 'createdAt' },
        { label: 'Date', key: 'date' },
        { label: 'Tour', key: 'tourName' },
        { label: 'Guests', key: 'people' },
        { label: 'Pickup', key: 'pickupName' },
        { label: 'Subtotal', key: 'subtotal' },
        { label: 'Total', key: 'total' },
        { label: 'Status', key: 'status' },
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'WhatsApp', key: 'whatsapp' },
        { label: 'Message', key: 'message' },
      ],
      bookings
    );
    sendCsv(res, `bookings-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.booking_requests where id = $1', [
      req.params.id,
    ]);
    if (!rows[0]) throw httpError(404, 'Booking not found.');

    const [history, notes, guides] = await Promise.all([
      query(
        `select h.*, u.name as actor_name
         from public.booking_status_history h
         left join public.admin_users u on u.id = h.changed_by
         where h.booking_id = $1 order by h.created_at desc`,
        [req.params.id]
      ),
      query(
        `select * from public.booking_notes where booking_id = $1 order by created_at desc`,
        [req.params.id]
      ),
      query('select id, name, role from public.guides order by sort_order, id'),
    ]);

    res.json({
      success: true,
      booking: {
        ...serializeBooking(rows[0]),
        guideId: rows[0].guide_id,
        source: rows[0].source,
        discount: Number(rows[0].discount || 0),
        updatedAt: rows[0].updated_at,
      },
      history: history.rows.map((row) => ({
        id: row.id,
        fromStatus: row.from_status,
        toStatus: row.to_status,
        note: row.note,
        actorName: row.actor_name,
        createdAt: row.created_at,
      })),
      notes: notes.rows.map((row) => ({
        id: row.id,
        note: row.note,
        authorEmail: row.author_email,
        createdAt: row.created_at,
      })),
      guides: guides.rows,
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const tourId = cleanString(req.body.tour_id || req.body.tourId, 80);
    const pickupId = cleanString(req.body.pickup_id || req.body.pickupId, 80);
    const date = cleanDate(req.body.date);
    const people = cleanInt(req.body.people, 1, MAX_PEOPLE);
    const name = cleanString(req.body.name, 120);
    const email = cleanEmail(req.body.email);
    const whatsapp = cleanString(req.body.whatsapp, 40);
    const message = cleanString(req.body.message, 2000);
    const source = ['admin', 'whatsapp', 'phone'].includes(req.body.source) ? req.body.source : 'admin';
    const guideId = req.body.guide_id || req.body.guideId || null;
    const discount = Math.max(0, Number(req.body.discount) || 0);

    const errors = [];
    if (!tourId) errors.push({ field: 'tour_id', message: 'Tour is required.' });
    if (!date) errors.push({ field: 'date', message: 'A valid date is required.' });
    if (!people) errors.push({ field: 'people', message: `Guests must be 1–${MAX_PEOPLE}.` });
    if (!name) errors.push({ field: 'name', message: 'Name is required.' });
    if (email === null) errors.push({ field: 'email', message: 'Email is not valid.' });
    if (!whatsapp || whatsapp.replace(/\D/g, '').length < 7) {
      errors.push({ field: 'whatsapp', message: 'A valid WhatsApp number is required.' });
    }
    if (errors.length) throw httpError(400, 'Validation failed', errors);

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

      await assertCapacity(client.query.bind(client), { tourId, date, people });

      const subtotal = Number(tour.price) * people;
      const pickupFee = pickup ? Number(pickup.fee) : 0;
      if (discount > subtotal + pickupFee) {
        throw httpError(400, 'Discount cannot exceed the booking total.');
      }
      const total = subtotal + pickupFee - discount;

      const inserted = await client.query(
        `insert into public.booking_requests
          (tour_id, tour_name, date, people, pickup_id, pickup_name, pickup_fee,
           subtotal, total, name, email, whatsapp, message, status, source,
           guide_id, discount, updated_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending',$14,$15,$16,$17)
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
          total,
          name,
          email || null,
          whatsapp,
          message || null,
          source,
          guideId,
          discount,
          req.admin?.id || null,
        ]
      );

      const row = inserted.rows[0];
      await client.query(
        `insert into public.booking_status_history (booking_id, from_status, to_status, changed_by, note)
         values ($1, null, 'pending', $2, 'Created from admin panel')`,
        [row.id, req.admin?.id || null]
      );
      return row;
    });

    await writeAudit(req, { action: 'create', entity: 'booking', entityId: booking.id });
    res.status(201).json({ success: true, booking: serializeBooking(booking) });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.booking_requests where id = $1', [
      req.params.id,
    ]);
    const current = rows[0];
    if (!current) throw httpError(404, 'Booking not found.');

    const patch = {};
    const body = req.body || {};

    if (body.status !== undefined) {
      const status = cleanString(body.status, 20);
      if (!STATUSES.includes(status)) throw httpError(400, 'Invalid status.');
      if (status !== current.status && !(TRANSITIONS[current.status] || []).includes(status)) {
        throw httpError(400, `Cannot change status from ${current.status} to ${status}.`);
      }
      patch.status = status;
    }

    if (body.name !== undefined) {
      const name = cleanString(body.name, 120);
      if (!name) throw httpError(400, 'Name cannot be empty.');
      patch.name = name;
    }
    if (body.email !== undefined) {
      const email = cleanEmail(body.email);
      if (email === null) throw httpError(400, 'Email is not valid.');
      patch.email = email || null;
    }
    if (body.whatsapp !== undefined) {
      const whatsapp = cleanString(body.whatsapp, 40);
      if (!whatsapp || whatsapp.replace(/\D/g, '').length < 7) {
        throw httpError(400, 'A valid WhatsApp number is required.');
      }
      patch.whatsapp = whatsapp;
    }
    if (body.message !== undefined) patch.message = cleanString(body.message, 2000) || null;
    if (body.guide_id !== undefined || body.guideId !== undefined) {
      patch.guide_id = body.guide_id || body.guideId || null;
    }
    if (body.date !== undefined) {
      const date = cleanDate(body.date);
      if (!date) throw httpError(400, 'A valid date is required.');
      patch.date = date;
    }
    if (body.people !== undefined) {
      const people = cleanInt(body.people, 1, MAX_PEOPLE);
      if (!people) throw httpError(400, `Guests must be 1–${MAX_PEOPLE}.`);
      patch.people = people;
    }
    if (body.tour_id !== undefined || body.tourId !== undefined) {
      patch.tour_id = cleanString(body.tour_id || body.tourId, 80);
    }
    if (body.pickup_id !== undefined || body.pickupId !== undefined) {
      patch.pickup_id = body.pickup_id || body.pickupId || null;
    }
    if (body.discount !== undefined) {
      const discount = Math.max(0, Number(body.discount) || 0);
      patch.discount = discount;
    }

    const pricingTouched =
      patch.date !== undefined ||
      patch.people !== undefined ||
      patch.tour_id !== undefined ||
      patch.pickup_id !== undefined ||
      patch.discount !== undefined;

    const updated = await withTransaction(async (client) => {
      const next = { ...current, ...patch };

      if (patch.tour_id || patch.pickup_id !== undefined) {
        const tourResult = await client.query(
          'select id, name, price from public.tours where id = $1',
          [next.tour_id]
        );
        if (!tourResult.rows[0]) throw httpError(400, 'Tour not found.');
        next.tour_name = tourResult.rows[0].name;
        next.price = Number(tourResult.rows[0].price);

        let pickup = null;
        if (patch.pickup_id) {
          const pickupResult = await client.query(
            'select id, label, fee from public.pickups where id = $1',
            [patch.pickup_id]
          );
          pickup = pickupResult.rows[0];
          if (!pickup) throw httpError(400, 'Pickup point not found.');
        }
        next.pickup_id = pickup?.id || null;
        next.pickup_name = pickup?.label || null;
        next.pickup_fee = pickup ? Number(pickup.fee) : 0;
      }

      if (pricingTouched) {
        if (!patch.tour_id) {
          const tourResult = await client.query('select price from public.tours where id = $1', [
            next.tour_id,
          ]);
          next.price = Number(tourResult.rows[0]?.price || 0);
        }
        if (patch.pickup_id !== undefined && !patch.tour_id) {
          if (patch.pickup_id) {
            const pickupResult = await client.query(
              'select id, label, fee from public.pickups where id = $1',
              [patch.pickup_id]
            );
            const pickup = pickupResult.rows[0];
            if (!pickup) throw httpError(400, 'Pickup point not found.');
            next.pickup_name = pickup.label;
            next.pickup_fee = Number(pickup.fee);
          } else {
            next.pickup_name = null;
            next.pickup_fee = 0;
          }
        }

        next.subtotal = Number(next.price) * Number(next.people);
        next.discount = Number(next.discount || 0);
        if (next.discount > next.subtotal + Number(next.pickup_fee || 0)) {
          throw httpError(400, 'Discount cannot exceed the booking total.');
        }
        next.total = next.subtotal + Number(next.pickup_fee || 0) - next.discount;

        await assertCapacity(client.query.bind(client), {
          tourId: next.tour_id,
          date: next.date,
          people: Number(next.people),
          excludeId: current.id,
        });
      }

      const columns = [];
      const values = [];
      const assign = (column, value) => {
        values.push(value);
        columns.push(`${column} = $${values.length}`);
      };

      for (const column of [
        'status',
        'date',
        'people',
        'tour_id',
        'tour_name',
        'pickup_id',
        'pickup_name',
        'pickup_fee',
        'subtotal',
        'total',
        'discount',
        'name',
        'email',
        'whatsapp',
        'message',
        'guide_id',
      ]) {
        if (next[column] !== undefined && next[column] !== current[column]) {
          assign(column, next[column]);
        }
      }

      if (!columns.length) return current;

      assign('updated_by', req.admin?.id || null);
      values.push(current.id);
      const result = await client.query(
        `update public.booking_requests set ${columns.join(', ')}
         where id = $${values.length} returning *`,
        values
      );

      if (patch.status && patch.status !== current.status) {
        await client.query(
          `insert into public.booking_status_history
            (booking_id, from_status, to_status, changed_by, note)
           values ($1, $2, $3, $4, $5)`,
          [
            current.id,
            current.status,
            patch.status,
            req.admin?.id || null,
            cleanString(body.note, 300) || null,
          ]
        );
      }

      return result.rows[0];
    });

    await writeAudit(req, {
      action: patch.status ? 'status_change' : 'update',
      entity: 'booking',
      entityId: current.id,
      diff: { before: { status: current.status, date: current.date, total: current.total }, after: patch },
    });

    if (patch.status === 'confirmed' && current.status !== 'confirmed' && updated.email) {
      await queueNotification({
        channel: 'email',
        recipient: updated.email,
        template: 'booking_confirmed',
        payload: { booking: serializeBooking(updated) },
      });
    }

    res.json({ success: true, booking: serializeBooking(updated) });
  })
);

router.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const note = cleanString(req.body.note, 2000);
    if (!note) throw httpError(400, 'Note cannot be empty.');

    const exists = await query('select 1 from public.booking_requests where id = $1', [req.params.id]);
    if (!exists.rows[0]) throw httpError(404, 'Booking not found.');

    const { rows } = await query(
      `insert into public.booking_notes (booking_id, author_id, author_email, note)
       values ($1, $2, $3, $4) returning *`,
      [req.params.id, req.admin?.id || null, req.admin?.email || null, note]
    );

    await writeAudit(req, { action: 'create', entity: 'booking_note', entityId: rows[0].id });
    res.status(201).json({
      success: true,
      note: {
        id: rows[0].id,
        note: rows[0].note,
        authorEmail: rows[0].author_email,
        createdAt: rows[0].created_at,
      },
    });
  })
);

export default router;