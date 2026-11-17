import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Field from '../components/Field';
import { formatDate } from '../../lib/format';

function ConvertModal({ open, onClose, message, onDone }) {
  const [tours, setTours] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [form, setForm] = useState({ tour_id: '', date: '', people: 1, pickup_id: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      tour_id: message?.tourId || '',
      date: message?.preferredDate || '',
      people: message?.people || 1,
      pickup_id: '',
    });
    Promise.all([adminApi.get('/tours'), adminApi.get('/pickups')])
      .then(([tourPayload, pickupPayload]) => {
        setTours(tourPayload.tours || []);
        setPickups((pickupPayload.pickups || []).filter((item) => item.active));
      })
      .catch((err) => setError(err.message));
  }, [open, message]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = await adminApi.post(`/messages/${message.id}/convert-to-booking`, form);
      onDone(payload.booking);
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
      title="Convert message to booking"
      footer={
        <>
          <button type="button" className="admin-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="admin-convert-form" className="admin-btn primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create booking'}
          </button>
        </>
      }
    >
      <form id="admin-convert-form" className="admin-form" onSubmit={submit}>
        {error ? <p className="admin-error">{error}</p> : null}
        <Field label="Tour">
          <select value={form.tour_id} onChange={(event) => setForm((prev) => ({ ...prev, tour_id: event.target.value }))} required>
            <option value="">Choose a tour</option>
            {tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.name}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} required />
        </Field>
        <Field label="Guests">
          <input type="number" min="1" max="8" value={form.people} onChange={(event) => setForm((prev) => ({ ...prev, people: event.target.value }))} required />
        </Field>
        <Field label="Pickup">
          <select value={form.pickup_id} onChange={(event) => setForm((prev) => ({ ...prev, pickup_id: event.target.value }))}>
            <option value="">No pickup</option>
            {pickups.map((pickup) => <option key={pickup.id} value={pickup.id}>{pickup.label}</option>)}
          </select>
        </Field>
      </form>
    </Modal>
  );
}

export default function Messages() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [convertOpen, setConvertOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const search = new URLSearchParams();
    if (status) search.set('status', status);
    if (term) search.set('q', term);
    search.set('limit', '100');
    adminApi
      .get(`/messages?${search.toString()}`)
      .then((payload) => {
        setRows(payload.messages || []);
        setSelected((prev) => {
          const next = (payload.messages || []).find((item) => item.id === prev?.id);
          return next || payload.messages?.[0] || null;
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (selected) setNote(selected.adminNotes || '');
  }, [selected?.id]);

  const updateStatus = async (nextStatus) => {
    if (!selected) return;
    try {
      const payload = await adminApi.patch(`/messages/${selected.id}`, { status: nextStatus, admin_notes: note });
      setSelected((prev) => ({ ...prev, ...payload.message, adminNotes: note }));
      setRows((prev) => prev.map((item) => (item.id === selected.id ? { ...item, ...payload.message } : item)));
    } catch (err) {
      setError(err.message);
    }
  };

  const saveNote = async () => {
    if (!selected) return;
    try {
      await adminApi.patch(`/messages/${selected.id}`, { status: selected.status, admin_notes: note });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Contact form enquiries. Reply on WhatsApp or convert a message into a booking."
        actions={
          <button type="button" className="admin-btn ghost" onClick={load}>Refresh</button>
        }
      />

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-filters">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
        <input
          placeholder="Search name, email, WhatsApp, message…"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && load()}
        />
        <button type="button" className="admin-btn ghost" onClick={load}>Search</button>
      </div>

      <div className="admin-inbox">
        <div className="admin-inbox-list">
          {loading ? <p className="admin-muted">Loading…</p> : null}
          {!loading && rows.length === 0 ? <p className="admin-muted">No messages.</p> : null}
          {rows.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-inbox-item ${selected?.id === item.id ? 'active' : ''}`}
              onClick={() => setSelected(item)}
            >
              <div>
                <strong>{item.name}</strong>
                <StatusBadge status={item.status} />
              </div>
              <small>{item.message?.slice(0, 90) || 'No message body'}</small>
              <span>{formatDate(String(item.createdAt).slice(0, 10))} · {item.whatsapp}</span>
            </button>
          ))}
        </div>

        <div className="admin-inbox-detail">
          {!selected ? (
            <p className="admin-muted">Select a message.</p>
          ) : (
            <>
              <div className="admin-panel-head">
                <div>
                  <h2>{selected.name}</h2>
                  <p className="admin-muted">{formatDate(String(selected.createdAt).slice(0, 10))}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <dl className="admin-detail-list">
                <div><dt>WhatsApp</dt><dd>{selected.whatsapp}</dd></div>
                <div><dt>Email</dt><dd>{selected.email || '—'}</dd></div>
                <div><dt>Preferred date</dt><dd>{selected.preferredDate ? formatDate(selected.preferredDate) : '—'}</dd></div>
                <div><dt>Guests</dt><dd>{selected.people || '—'}</dd></div>
                <div><dt>Tour</dt><dd>{selected.tourId || '—'}</dd></div>
              </dl>

              <div className="admin-message-body">{selected.message || 'No message body.'}</div>

              <Field label="Internal notes">
                <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} onBlur={saveNote} />
              </Field>

              <div className="admin-inline wrap">
                <a className="admin-btn primary sm" href={`https://wa.me/${String(selected.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                  Reply on WhatsApp
                </a>
                {selected.email ? <a className="admin-btn ghost sm" href={`mailto:${selected.email}`}>Reply by email</a> : null}
                <button type="button" className="admin-btn ghost sm" onClick={() => updateStatus('read')}>Mark read</button>
                <button type="button" className="admin-btn ghost sm" onClick={() => updateStatus('replied')}>Mark replied</button>
                <button type="button" className="admin-btn ghost sm" onClick={() => updateStatus('archived')}>Archive</button>
                <button type="button" className="admin-btn primary sm" onClick={() => setConvertOpen(true)}>Convert to booking</button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConvertModal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        message={selected}
        onDone={(booking) => {
          window.location.href = `/admin/bookings/${booking.id}`;
        }}
      />
    </>
  );
}