import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { formatMoney, formatDate } from '../../lib/format';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminApi
      .get('/dashboard')
      .then((payload) => active && setData(payload))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <div className="admin-panel"><p className="admin-error">{error}</p></div>;
  if (!data) return <div className="admin-panel"><p className="admin-muted">Loading dashboard…</p></div>;

  const { stats, trend, popular, nextTrips } = data;
  const maxTrend = Math.max(1, ...trend.map((item) => item.bookings));

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A quick look at bookings, revenue and what needs attention."
        actions={
          <>
            <Link className="admin-btn ghost" to="/admin/bookings">All bookings</Link>
            <Link className="admin-btn primary" to="/admin/bookings?new=1">New booking</Link>
          </>
        }
      />

      <div className="admin-stats">
        <StatCard label="Pending bookings" value={stats.pendingBookings} hint="Waiting for confirmation" tone="warning" />
        <StatCard label="Next 7 days" value={stats.upcomingTrips} hint={`${stats.upcomingGuests} guest(s)`} />
        <StatCard label="Revenue this month" value={formatMoney(stats.revenueMonth)} hint={`${stats.confirmedMonth} confirmed bookings`} tone="success" />
        <StatCard label="New messages" value={stats.newMessages} hint="Unread contact messages" tone="info" />
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Bookings, last 30 days</h2>
            <span className="admin-muted">{stats.bookingsMonth} created this month</span>
          </div>
          {trend.length === 0 ? (
            <p className="admin-muted">No bookings in the last 30 days.</p>
          ) : (
            <div className="admin-chart">
              {trend.map((item) => (
                <div className="admin-chart-col" key={item.date} title={`${item.date}: ${item.bookings} booking(s)`}>
                  <div className="admin-chart-bar" style={{ height: `${Math.max(6, (item.bookings / maxTrend) * 100)}%` }} />
                  <span>{item.date.slice(8)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Popular tours</h2>
            <span className="admin-muted">Last 90 days</span>
          </div>
          {popular.length === 0 ? (
            <p className="admin-muted">No booking data yet.</p>
          ) : (
            <ul className="admin-rank-list">
              {popular.map((item) => (
                <li key={item.tourName}>
                  <div>
                    <strong>{item.tourName}</strong>
                    <small>{item.bookings} bookings · {item.guests} guests</small>
                  </div>
                  <span>{formatMoney(item.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>Upcoming trips</h2>
          <Link className="admin-topbar-link" to="/admin/bookings">View all</Link>
        </div>
        <DataTable
          rows={nextTrips}
          empty="No upcoming trips."
          onRowClick={(row) => { window.location.href = `/admin/bookings/${row.id}`; }}
          columns={[
            { key: 'date', label: 'Date', render: (value) => formatDate(value) },
            { key: 'tourName', label: 'Tour' },
            { key: 'name', label: 'Guest' },
            { key: 'people', label: 'Guests' },
            { key: 'total', label: 'Total', render: (value) => formatMoney(value) },
            { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
            { key: 'whatsapp', label: 'WhatsApp' },
          ]}
        />
      </section>
    </>
  );
}