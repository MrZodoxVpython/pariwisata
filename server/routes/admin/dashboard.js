import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler } from '../../lib/http.js';
import { serializeBooking } from '../../lib/serializers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [
      pending,
      upcoming,
      revenue,
      messages,
      trend,
      popular,
      nextTrips,
      totals,
    ] = await Promise.all([
      query(`select count(*)::int as count from public.booking_requests where status = 'pending'`),
      query(
        `select count(*)::int as count, coalesce(sum(people), 0)::int as guests
         from public.booking_requests
         where status in ('pending', 'confirmed')
           and date between current_date and current_date + 7`
      ),
      query(
        `select coalesce(sum(total - discount), 0)::bigint as revenue, count(*)::int as bookings
         from public.booking_requests
         where status in ('confirmed', 'completed')
           and date_trunc('month', date) = date_trunc('month', current_date)`
      ),
      query(`select count(*)::int as count from public.contact_messages where status = 'new'`),
      query(
        `select date::text as date, count(*)::int as bookings, coalesce(sum(people), 0)::int as guests
         from public.booking_requests
         where date >= current_date - 29
         group by date
         order by date`
      ),
      query(
        `select tour_name, count(*)::int as bookings,
                coalesce(sum(people), 0)::int as guests,
                coalesce(sum(total - discount), 0)::bigint as revenue
         from public.booking_requests
         where status in ('pending', 'confirmed', 'completed')
           and date >= current_date - 90
         group by tour_name
         order by bookings desc
         limit 5`
      ),
      query(
        `select * from public.booking_requests
         where status in ('pending', 'confirmed') and date >= current_date
         order by date asc, created_at asc
         limit 8`
      ),
      query(
        `select
           (select count(*)::int from public.tours where active = true) as tours,
           (select count(*)::int from public.booking_requests
              where date_trunc('month', created_at) = date_trunc('month', current_date)) as bookings_month,
           (select count(*)::int from public.booking_requests
              where status in ('confirmed', 'completed')
                and date_trunc('month', date) = date_trunc('month', current_date)) as confirmed_month`
      ),
    ]);

    res.json({
      success: true,
      stats: {
        pendingBookings: pending.rows[0].count,
        upcomingTrips: upcoming.rows[0].count,
        upcomingGuests: upcoming.rows[0].guests,
        revenueMonth: Number(revenue.rows[0].revenue),
        confirmedMonth: revenue.rows[0].bookings,
        newMessages: messages.rows[0].count,
        activeTours: totals.rows[0].tours,
        bookingsMonth: totals.rows[0].bookings_month,
        completedMonth: totals.rows[0].confirmed_month,
      },
      trend: trend.rows.map((row) => ({
        date: row.date,
        bookings: row.bookings,
        guests: row.guests,
      })),
      popular: popular.rows.map((row) => ({
        tourName: row.tour_name,
        bookings: row.bookings,
        guests: row.guests,
        revenue: Number(row.revenue),
      })),
      nextTrips: nextTrips.rows.map(serializeBooking),
    });
  })
);

export default router;