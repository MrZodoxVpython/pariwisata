import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { formatMoney, formatDate } from '../../lib/format';

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const [filters, setFilters] = useState({
    from: `${today.slice(0, 7)}-01`,
    to: today,
    groupBy: 'tour',
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    const search = new URLSearchParams(filters);
    adminApi
      .get(`/reports?${search.toString()}`)
      .then(setData)
      .catch((err) => setError(err.message));
  };

  useEffect(load, [filters.from, filters.to, filters.groupBy]);

  const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const max = data ? Math.max(1, ...data.groups.map((item) => item.bookings)) : 1;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Booking volume, guests and revenue for a date range. Revenue counts confirmed and completed bookings."
        actions={<button type="button" className="admin-btn ghost" onClick={() => adminApi.download(`/admin/reports/export.csv?from=${filters.from}&to=${filters.to}`, `report-${filters.from}-${filters.to}.csv`).catch((err) => setError(err.message))}>Export CSV</button>}
      />
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-filters">
        <input type="date" value={filters.from} onChange={(event) => set('from', event.target.value)} />
        <input type="date" value={filters.to} onChange={(event) => set('to', event.target.value)} />
        <select value={filters.groupBy} onChange={(event) => set('groupBy', event.target.value)}>
          <option value="tour">Group by tour</option>
          <option value="month">Group by month</option>
          <option value="pickup">Group by pickup</option>
          <option value="status">Group by status</option>
        </select>
      </div>

      {!data ? (
        <div className="admin-panel"><p className="admin-muted">Loading report…</p></div>
      ) : (
        <>
          <div className="admin-stats">
            <StatCard label="Bookings" value={data.summary.bookings} hint={`${data.summary.guests} guests`} />
            <StatCard label="Revenue" value={formatMoney(data.summary.revenue)} hint={`Avg ${formatMoney(data.summary.average)} / booking`} tone="success" />
            <StatCard label="Confirmed" value={data.summary.confirmed} hint={`${data.summary.completed} completed`} tone="info" />
            <StatCard label="Cancelled" value={data.summary.cancelled} hint={`${data.summary.pending} pending`} tone="warning" />
          </div>

          <div className="admin-grid-2">
            <section className="admin-panel">
              <h2>Bookings by {filters.groupBy}</h2>
              <div className="admin-chart horizontal">
                {data.groups.map((item) => (
                  <div className="admin-chart-row" key={item.label}>
                    <span>{item.label || '—'}</span>
                    <div><i style={{ width: `${(item.bookings / max) * 100}%` }} /></div>
                    <strong>{item.bookings}</strong>
                  </div>
                ))}
                {data.groups.length === 0 ? <p className="admin-muted">No bookings in this range.</p> : null}
              </div>
            </section>

            <section className="admin-panel">
              <h2>Status breakdown</h2>
              <ul className="admin-rank-list">
                {data.statuses.map((item) => (
                  <li key={item.status}>
                    <div><strong>{item.status}</strong><small>{item.count} booking(s)</small></div>
                  </li>
                ))}
                {data.statuses.length === 0 ? <li className="admin-muted">No data.</li> : null}
              </ul>
            </section>
          </div>

          <section className="admin-panel flush">
            <DataTable
              rows={data.groups}
              rowKey="label"
              empty="No bookings in this range."
              columns={[
                { key: 'label', label: filters.groupBy },
                { key: 'bookings', label: 'Bookings' },
                { key: 'guests', label: 'Guests' },
                { key: 'revenue', label: 'Revenue', render: (value) => formatMoney(value) },
              ]}
            />
          </section>

          <p className="admin-muted">Range: {formatDate(data.from)} – {formatDate(data.to)}</p>
        </>
      )}
    </>
  );
}