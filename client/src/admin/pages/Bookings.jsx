import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Field from '../components/Field';
import { formatMoney, formatDate } from '../../lib/format';

const STATUSES = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

function NewBookingModal({ open, onClose, onCreated }) {
  const [tours, setTours] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [form, setForm] = useState({
    tour_id: '',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    people: 2,
    pickup_id: '',
    name: '',
    email: '',
    whatsapp: '',
    message: '',
    source: 'whatsapp',
    discount: 0,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([adminApi.get('/tours'), adminApi.get('/pickups')])
      .then(([tourPayload, pickupPayload]) => {
        setTours(tourPayload.tours || []);
        setPickups((pickupPayload.pickups || []).filter((item) => item.active));
      })
      .catch((err) => setError(err.message));
  }, [open]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = await adminApi.post('/bookings', form);
      onCreated(payload.booking);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New booking"
      wide
      footer={
        <>
          <button type="button" className="admin-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="admin-new-booking" className="admin-btn primary" disabled={busy}>
            {busy ? 'Saving…' : 'Create booking'}
          </button>
        </>
      }
    >
      <form id="admin-new-booking" className="admin-form grid" onSubmit={submit}>
        {error ? <p className="admin-error span-2">{error}</p> : null}
        <Field label="Tour">
          <select value={form.tour_id} onChange={(event) => set('tour_id', event.target.value)} required>
            <option value="">Choose a tour</option>
            {tours.map((tour) => (
              <option key={tour.id} value={tour.id}>{tour.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={form.date} onChange={(event) => set('date', event.target.value)} required />
        </Field>
        <Field label="Guests">
          <input type="number" min="1" max="8" value={form.people} onChange={(event) => set('people', event.target.value)} required />
        </Field>
        <Field label="Pickup point">
          <select value={form.pickup_id} onChange={(event) => set('pickup_id', event.target.value)}>
            <option value="">No pickup</option>
            {pickups.map((pickup) => (
              <option key={pickup.id} value={pickup.id}>{pickup.label} (+{formatMoney(pickup.fee)})</option>
            ))}
          </select>
        </Field>
        <Field label="Guest name">
          <input value={form.name} onChange={(event) => set('name', event.target.value)} required />
        </Field>
        <Field label="WhatsApp">
          <input value={form.whatsapp} onChange={(event) => set('whatsapp', event.target.value)} placeholder="+62…" required />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={(event) => set('email', event.target.value)} />
        </Field>
        <Field label="Source">
          <select value={form.source} onChange={(event) => set('source', event.target.value)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="admin">Admin / walk-in</option>
          </select>
        </Field>
        <Field label="Discount (IDR)">
          <input type="number" min="0" value={form.discount} onChange={(event) => set('discount', event.target.value)} />
        </Field>
        <Field label="Notes" className="span-2">
          <textarea rows={3} value={form.message} onChange={(event) => set('message', event.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}

export default function Bookings() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newOpen, setNewOpen] = useState(params.get('new') === '1');
  const [filters, setFilters] = useState({
    status: params.get('status') || '',
    q: params.get('q') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    page: Number(params.get('page') || 1),
  });

  const load = () => {
    setLoading(true);
    setError('');
    const search = new URLSearchParams();
    if (filters.status) search.set('status', filters.status);
    if (filters.q) search.set('q', filters.q);
    if (filters.from) search.set('from', filters.from);
    if (filters.to) search.set('to', filters.to);
    search.set('page', String(filters.page));
    search.set('limit', '25');
    setParams(search, { replace: true });

    adminApi
      .get(`/bookings?${search.toString()}`)
      .then((payload) => {
        setRows(payload.bookings || []);
        setTotal(payload.total || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.q, filters.from, filters.to, filters.page]);

  const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));

  const exportCsv = () => {
    adminApi
      .download('/admin/bookings/export.csv', `bookings-${new Date().toISOString().slice(0, 10)}.csv`)
      .catch((err) => setError(err.message));
  };

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle={`${total} booking request(s)`}
        actions={
          <>
            <button type="button" className="admin-btn ghost" onClick={exportCsv}>Export CSV</button>
            <button type="button" className="admin-btn primary" onClick={() => setNewOpen(true)}>New booking</button>
          </>
        }
      />

      <div className="admin-filters">
        <select value={filters.status} onChange={(event) => set('status', event.target.value)}>
          {STATUSES.map((status) => (
            <option key={status || 'all'} value={status}>{status ? status : 'All statuses'}</option>
          ))}
        </select>
        <input
          placeholder="Search name, WhatsApp, email, tour…"
          value={filters.q}
          onChange={(event) => set('q', event.target.value)}
        />
        <input type="date" value={filters.from} onChange={(event) => set('from', event.target.value)} />
        <input type="date" value={filters.to} onChange={(event) => set('to', event.target.value)} />
        <button type="button" className="admin-btn ghost" onClick={() => setFilters({ status: '', q: '', from: '', to: '', page: 1 })}>
          Reset
        </button>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-panel flush">
        <DataTable
          loading={loading}
          rows={rows}
          empty="No bookings match these filters."
          onRowClick={(row) => navigate(`/admin/bookings/${row.id}`)}
          columns={[
            { key: 'date', label: 'Trip date', render: (value) => formatDate(value) },
            {
              key: 'name',
              label: 'Guest',
              render: (value, row) => (
                <div className="admin-cell-stack">
                  <strong>{value}</strong>
                  <small>{row.whatsapp}</small>
                </div>
              ),
            },
            { key: 'tourName', label: 'Tour' },
            { key: 'people', label: 'Guests' },
            { key: 'total', label: 'Total', render: (value) => formatMoney(value) },
            { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
            { key: 'createdAt', label: 'Created', render: (value) => formatDate(String(value).slice(0, 10)) },
          ]}
        />
      </div>

      <div className="admin-pagination">
        <button type="button" className="admin-btn ghost sm" disabled={filters.page <= 1} onClick={() => set('page', filters.page - 1)}>
          ← Previous
        </button>
        <span>Page {filters.page} of {pages}</span>
        <button type="button" className="admin-btn ghost sm" disabled={filters.page >= pages} onClick={() => set('page', filters.page + 1)}>
          Next →
        </button>
      </div>

      <NewBookingModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(booking) => navigate(`/admin/bookings/${booking.id}`)}
      />
    </>
  );
}