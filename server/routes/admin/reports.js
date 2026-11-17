import { Router } from 'express';
import { query } from '../../lib/db.js';
import { asyncHandler, cleanString } from '../../lib/http.js';
import { toCsv, sendCsv } from '../../lib/csv.js';

const router = Router();

const GROUPS = {
  tour: {
    label: 'tour',
    query: `select tour_name as label,
                   count(*)::int as bookings,
                   coalesce(sum(people), 0)::int as guests,
                   coalesce(sum(case when status in ('confirmed','completed') then total - discount else 0 end), 0)::bigint as revenue
            from public.booking_requests
            where date between $1 and $2 and status <> 'cancelled'
            group by tour_name order by bookings desc`,
  },
  month: {
    label: 'month',
    query: `select to_char(date_trunc('month', date), 'YYYY-MM') as label,
                   count(*)::int as bookings,
                   coalesce(sum(people), 0)::int as guests,
                   coalesce(sum(case when status in ('confirmed','completed') then total - discount else 0 end), 0)::bigint as revenue
            from public.booking_requests
            where date between $1 and $2 and status <> 'cancelled'
            group by 1 order by 1`,
  },
  pickup: {
    label: 'pickup',
    query: `select coalesce(pickup_name, 'No pickup') as label,
                   count(*)::int as bookings,
                   coalesce(sum(people), 0)::int as guests,
                   coalesce(sum(case when status in ('confirmed','completed') then total - discount else 0 end), 0)::bigint as revenue
            from public.booking_requests
            where date between $1 and $2 and status <> 'cancelled'
            group by 1 order by bookings desc`,
  },
  status: {
    label: 'status',
    query: `select status as label,
                   count(*)::int as bookings,
                   coalesce(sum(people), 0)::int as guests,
                   coalesce(sum(case when status in ('confirmed','completed') then total - discount else 0 end), 0)::bigint as revenue
            from public.booking_requests
            where date between $1 and $2
            group by 1 order by bookings desc`,
  },
};

function range(req) {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from) ? req.query.from : monthStart;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to) ? req.query.to : today;
  return { from, to };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from, to } = range(req);
    const groupBy = GROUPS[req.query.groupBy] ? req.query.groupBy : 'tour';

    const [summary, grouped, statuses] = await Promise.all([
      query(
        `select count(*)::int as bookings,
                coalesce(sum(people), 0)::int as guests,
                coalesce(sum(case when status in ('confirmed','completed') then total - discount else 0 end), 0)::bigint as revenue,
                coalesce(avg(case when status in ('confirmed','completed') then total - discount end), 0)::bigint as average,
                count(*) filter (where status = 'pending')::int as pending,
                count(*) filter (where status = 'confirmed')::int as confirmed,
                count(*) filter (where status = 'completed')::int as completed,
                count(*) filter (where status = 'cancelled')::int as cancelled
         from public.booking_requests
         where date between $1 and $2`,
        [from, to]
      ),
      query(GROUPS[groupBy].query, [from, to]),
      query(
        `select status, count(*)::int as count from public.booking_requests
         where date between $1 and $2 group by status`,
        [from, to]
      ),
    ]);

    res.json({
      success: true,
      from,
      to,
      groupBy,
      summary: {
        bookings: summary.rows[0].bookings,
        guests: summary.rows[0].guests,
        revenue: Number(summary.rows[0].revenue),
        average: Number(summary.rows[0].average),
        pending: summary.rows[0].pending,
        confirmed: summary.rows[0].confirmed,
        completed: summary.rows[0].completed,
        cancelled: summary.rows[0].cancelled,
      },
      groups: grouped.rows.map((row) => ({
        label: row.label,
        bookings: row.bookings,
        guests: row.guests,
        revenue: Number(row.revenue),
      })),
      statuses: statuses.rows,
    });
  })
);

router.get(
  '/export.csv',
  asyncHandler(async (req, res) => {
    const { from, to } = range(req);
    const { rows } = await query(
      `select * from public.booking_requests where date between $1 and $2 order by date`,
      [from, to]
    );
    const csv = toCsv(
      [
        { label: 'Date', key: 'date' },
        { label: 'Tour', key: 'tour_name' },
        { label: 'Guests', key: 'people' },
        { label: 'Pickup', key: 'pickup_name' },
        { label: 'Subtotal', key: 'subtotal' },
        { label: 'Discount', key: 'discount' },
        { label: 'Total', key: 'total' },
        { label: 'Status', key: 'status' },
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'WhatsApp', key: 'whatsapp' },
        { label: 'Source', key: 'source' },
      ],
      rows
    );
    sendCsv(res, `report-${from}-to-${to}.csv`, csv);
  })
);

export default router;