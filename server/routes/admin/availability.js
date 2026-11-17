import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, httpError, cleanString } from '../../lib/http.js';
import { writeAudit } from '../../lib/audit.js';

const router = Router();

function validDate(value) {
  const date = cleanString(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const from = validDate(req.query.from) || new Date().toISOString().slice(0, 10);
    const to =
      validDate(req.query.to) ||
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const tourId = cleanString(req.query.tourId, 80);

    const params = [from, to];
    let tourClause = '';
    if (tourId) {
      params.push(tourId);
      tourClause = `and tour_id = $${params.length}`;
    }

    const [tours, overrides, bookings] = await Promise.all([
      query('select id, name, daily_capacity from public.tours where active = true order by sort_order, name'),
      query(
        `select tour_id, date::text as date, capacity, is_closed, note
         from public.tour_availability
         where date between $1 and $2 ${tourClause}
         order by date`,
        params
      ),
      query(
        `select tour_id, date::text as date, coalesce(sum(people), 0)::int as booked
         from public.booking_requests
         where date between $1 and $2 and status <> 'cancelled' ${tourClause}
         group by tour_id, date`,
        params
      ),
    ]);

    res.json({
      success: true,
      from,
      to,
      tours: tours.rows.map((row) => ({
        id: row.id,
        name: row.name,
        dailyCapacity: row.daily_capacity,
      })),
      overrides: overrides.rows.map((row) => ({
        tourId: row.tour_id,
        date: row.date,
        capacity: row.capacity,
        isClosed: row.is_closed,
        note: row.note,
      })),
      bookings: bookings.rows.map((row) => ({
        tourId: row.tour_id,
        date: row.date,
        booked: row.booked,
      })),
    });
  })
);

router.put(
  '/:tourId/:date',
  asyncHandler(async (req, res) => {
    const tourId = cleanString(req.params.tourId, 80);
    const date = validDate(req.params.date);
    if (!date) throw httpError(400, 'Invalid date.');

    const tour = await query('select id, daily_capacity from public.tours where id = $1', [tourId]);
    if (!tour.rows[0]) throw httpError(404, 'Tour not found.');

    const capacity = Number(req.body.capacity);
    if (!Number.isInteger(capacity) || capacity < 0 || capacity > 50) {
      throw httpError(400, 'Capacity must be between 0 and 50.');
    }
    const isClosed = Boolean(req.body.is_closed ?? req.body.isClosed);
    const note = cleanString(req.body.note, 300) || null;

    const { rows } = await query(
      `insert into public.tour_availability (tour_id, date, capacity, is_closed, note)
       values ($1, $2, $3, $4, $5)
       on conflict (tour_id, date) do update set
         capacity = excluded.capacity,
         is_closed = excluded.is_closed,
         note = excluded.note,
         updated_at = now()
       returning *`,
      [tourId, date, capacity, isClosed, note]
    );

    await writeAudit(req, {
      action: 'update',
      entity: 'tour_availability',
      entityId: `${tourId}:${date}`,
      diff: { capacity, isClosed, note },
    });

    res.json({
      success: true,
      override: {
        tourId: rows[0].tour_id,
        date: rows[0].date,
        capacity: rows[0].capacity,
        isClosed: rows[0].is_closed,
        note: rows[0].note,
      },
    });
  })
);

router.post(
  '/bulk',
  asyncHandler(async (req, res) => {
    const tourIds = Array.isArray(req.body.tourIds) ? req.body.tourIds : [req.body.tourId];
    const cleanTourIds = tourIds.map((id) => cleanString(id, 80)).filter(Boolean);
    const from = validDate(req.body.from);
    const to = validDate(req.body.to);
    const isClosed = Boolean(req.body.is_closed ?? req.body.isClosed);
    const capacity = Number(req.body.capacity ?? 8);

    if (!cleanTourIds.length) throw httpError(400, 'Pick at least one tour.');
    if (!from || !to || from > to) throw httpError(400, 'A valid date range is required.');
    if (!Number.isInteger(capacity) || capacity < 0 || capacity > 50) {
      throw httpError(400, 'Capacity must be between 0 and 50.');
    }

    const { rows } = await query(
      `insert into public.tour_availability (tour_id, date, capacity, is_closed)
       select t.id, d::date, $3, $4
       from unnest($1::text[]) as t(id)
       cross join generate_series($2::date, $5::date, interval '1 day') as d
       on conflict (tour_id, date) do update set
         capacity = excluded.capacity,
         is_closed = excluded.is_closed,
         updated_at = now()
       returning tour_id, date, capacity, is_closed`,
      [cleanTourIds, from, capacity, isClosed, to]
    );

    await writeAudit(req, {
      action: 'bulk_update',
      entity: 'tour_availability',
      diff: { tourIds: cleanTourIds, from, to, isClosed, capacity, rows: rows.length },
    });

    res.json({ success: true, updated: rows.length });
  })
);

router.delete(
  '/:tourId/:date',
  asyncHandler(async (req, res) => {
    const date = validDate(req.params.date);
    if (!date) throw httpError(400, 'Invalid date.');
    await query('delete from public.tour_availability where tour_id = $1 and date = $2', [
      cleanString(req.params.tourId, 80),
      date,
    ]);
    await writeAudit(req, {
      action: 'delete',
      entity: 'tour_availability',
      entityId: `${req.params.tourId}:${date}`,
    });
    res.json({ success: true });
  })
);

export default router;