import { query } from './db.js';

const BOOKED_STATUSES = ['pending', 'confirmed', 'completed'];

/**
 * Returns capacity and usage for one tour on one date.
 * A tour_availability row overrides the tour's daily_capacity.
 */
export async function getAvailability(tourId, date, executor = query) {
  const tourResult = await executor(
    'select id, daily_capacity from public.tours where id = $1',
    [tourId]
  );
  const tour = tourResult.rows[0];
  if (!tour) return null;

  const overrideResult = await executor(
    'select capacity, is_closed from public.tour_availability where tour_id = $1 and date = $2',
    [tourId, date]
  );
  const override = overrideResult.rows[0];

  const bookedResult = await executor(
    `select coalesce(sum(people), 0)::int as booked
     from public.booking_requests
     where tour_id = $1 and date = $2 and status = any($3::text[])`,
    [tourId, date, BOOKED_STATUSES]
  );

  const capacity = override ? Number(override.capacity) : Number(tour.daily_capacity ?? 8);
  const booked = Number(bookedResult.rows[0]?.booked || 0);
  const isClosed = Boolean(override?.is_closed);

  return {
    tourId: tour.id,
    date,
    capacity,
    booked,
    remaining: isClosed ? 0 : Math.max(0, capacity - booked),
    isClosed,
    available: !isClosed && booked < capacity,
  };
}