import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Field from '../components/Field';
import { formatMoney, formatDate } from '../../lib/format';

const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: ['confirmed'],
  cancelled: ['pending'],
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tours, setTours] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [form, setForm] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');

  const load = () => {
    adminApi
      .get(`/bookings/${id}`)
      .then((payload) => {
        setData(payload);
        setForm({
          tour_id: payload.booking.tourId,
          date: payload.booking.date,
          people: payload.booking.people,
          pickup_id: payload.booking.pickupId || '',
          guide_id: payload.booking.guideId || '',
          discount: payload.booking.discount || 0,
          name: payload.booking.name,
          email: payload.booking.email || '',
          whatsapp: payload.booking.whatsapp,
          message: payload.booking.message || '',
        });
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    Promise.all([adminApi.get('/tours'), adminApi.get('/pickups')])
      .then(([tourPayload, pickupPayload]) => {
        setTours(tourPayload.tours || []);
        setPickups((pickupPayload.pickups || []).filter((item) => item.active));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved('');
    try {
      await adminApi.patch(`/bookings/${id}`, form);
      setSaved('Booking updated.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status) => {
    if (!window.confirm(`Change status to "${status}"?`)) return;
    setBusy(true);
    setError('');
    try {
      await adminApi.patch(`/bookings/${id}`, { status });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      await adminApi.post(`/bookings/${id}/notes`, { note });
      setNote('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) return <div className="admin-panel"><p className="admin-error">{error}</p></div>;
  if (!data || !form) return <div className="admin-panel"><p className="admin-muted">Loading booking…</p></div>;

  const { booking, history, notes, guides } = data;

  return (
    <>
      <PageHeader
        title={`Booking — ${booking.name}`}
        subtitle={`${booking.tourName} · ${formatDate(booking.date)} · ${booking.people} guest(s)`}
        actions={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => navigate('/admin/bookings')}>← Back</button>
            <a className="admin-btn ghost" href={`https://wa.me/${String(booking.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              WhatsApp guest
            </a>
          </>
        }
      />

      {error ? <p className="admin-error">{error}</p> : null}
      {saved ? <p className="admin-success">{saved}</p> : null}

      <div className="admin-grid-3">
        <section className="admin-panel">
          <h2>Current status</h2>
          <p><StatusBadge status={booking.status} /></p>
          <div className="admin-status-actions">
            {(TRANSITIONS[booking.status] || []).map((status) => (
              <button key={status} type="button" className="admin-btn ghost sm" disabled={busy} onClick={() => changeStatus(status)}>
                Mark {status}
              </button>
            ))}
          </div>
          <dl className="admin-detail-list">
            <div><dt>Subtotal</dt><dd>{formatMoney(booking.subtotal)}</dd></div>
            {booking.pickupFee ? <div><dt>Pickup fee</dt><dd>{formatMoney(booking.pickupFee)}</dd></div> : null}
            {booking.discount ? <div><dt>Discount</dt><dd>−{formatMoney(booking.discount)}</dd></div> : null}
            <div><dt>Total</dt><dd><strong>{formatMoney(booking.total)}</strong></dd></div>
            <div><dt>Source</dt><dd>{booking.source}</dd></div>
            <div><dt>Created</dt><dd>{formatDate(String(booking.createdAt).slice(0, 10))}</dd></div>
          </dl>
        </section>

        <section className="admin-panel span-2">
          <h2>Edit booking</h2>
          <form className="admin-form grid" onSubmit={save}>
            <Field label="Tour">
              <select value={form.tour_id} onChange={(event) => set('tour_id', event.target.value)}>
                {tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.name}</option>)}
              </select>
            </Field>
            <Field label="Trip date">
              <input type="date" value={form.date} onChange={(event) => set('date', event.target.value)} required />
            </Field>
            <Field label="Guests">
              <input type="number" min="1" max="8" value={form.people} onChange={(event) => set('people', event.target.value)} required />
            </Field>
            <Field label="Pickup point">
              <select value={form.pickup_id} onChange={(event) => set('pickup_id', event.target.value)}>
                <option value="">No pickup</option>
                {pickups.map((pickup) => <option key={pickup.id} value={pickup.id}>{pickup.label} (+{formatMoney(pickup.fee)})</option>)}
              </select>
            </Field>
            <Field label="Guide">
              <select value={form.guide_id} onChange={(event) => set('guide_id', event.target.value)}>
                <option value="">Not assigned</option>
                {guides.map((guide) => <option key={guide.id} value={guide.id}>{guide.name}</option>)}
              </select>
            </Field>
            <Field label="Discount (IDR)">
              <input type="number" min="0" value={form.discount} onChange={(event) => set('discount', event.target.value)} />
            </Field>
            <Field label="Guest name">
              <input value={form.name} onChange={(event) => set('name', event.target.value)} required />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsapp} onChange={(event) => set('whatsapp', event.target.value)} required />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(event) => set('email', event.target.value)} />
            </Field>
            <Field label="Notes" className="span-2">
              <textarea rows={3} value={form.message} onChange={(event) => set('message', event.target.value)} />
            </Field>
            <div className="span-2 admin-inline">
              <button type="submit" className="admin-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </section>
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <h2>Status history</h2>
          <ul className="admin-timeline">
            {history.map((item) => (
              <li key={item.id}>
                <strong>{item.fromStatus ? `${item.fromStatus} → ${item.toStatus}` : item.toStatus}</strong>
                <span>{item.actorName || 'System'} · {new Date(item.createdAt).toLocaleString('en-GB')}</span>
                {item.note ? <small>{item.note}</small> : null}
              </li>
            ))}
            {history.length === 0 ? <li className="admin-muted">No history yet.</li> : null}
          </ul>
        </section>

        <section className="admin-panel">
          <h2>Internal notes</h2>
          <form className="admin-note-form" onSubmit={addNote}>
            <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note for the team…" />
            <button type="submit" className="admin-btn primary sm" disabled={busy || !note.trim()}>Add note</button>
          </form>
          <ul className="admin-notes">
            {notes.map((item) => (
              <li key={item.id}>
                <p>{item.note}</p>
                <small>{item.authorEmail || 'Team'} · {new Date(item.createdAt).toLocaleString('en-GB')}</small>
              </li>
            ))}
            {notes.length === 0 ? <li className="admin-muted">No notes yet.</li> : null}
          </ul>
        </section>
      </div>
    </>
  );
}