import { useEffect, useMemo, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Field from '../components/Field';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const last = new Date(year, monthNumber, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}`, days: last, year, monthNumber };
}

export default function Availability() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tours, setTours] = useState([]);
  const [tourId, setTourId] = useState('');
  const [overrides, setOverrides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [editor, setEditor] = useState({ capacity: 8, is_closed: false, note: '' });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState({ from: '', to: '', capacity: 8, is_closed: true });

  const range = useMemo(() => monthRange(month), [month]);

  const load = () => {
    adminApi
      .get(`/availability?from=${range.from}&to=${range.to}`)
      .then((payload) => {
        setTours(payload.tours || []);
        setOverrides(payload.overrides || []);
        setBookings(payload.bookings || []);
        if (!tourId && payload.tours?.[0]) setTourId(payload.tours[0].id);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const tour = tours.find((item) => item.id === tourId);

  const overrideMap = useMemo(() => {
    const map = {};
    overrides.forEach((item) => {
      map[`${item.tourId}:${item.date}`] = item;
    });
    return map;
  }, [overrides]);

  const bookedMap = useMemo(() => {
    const map = {};
    bookings.forEach((item) => {
      map[`${item.tourId}:${item.date}`] = item.booked;
    });
    return map;
  }, [bookings]);

  const selectDay = (date) => {
    if (!tour) return;
    const override = overrideMap[`${tour.id}:${date}`];
    setSelected(date);
    setSaved('');
    setEditor({
      capacity: override?.capacity ?? tour.dailyCapacity,
      is_closed: override?.isClosed || false,
      note: override?.note || '',
    });
  };

  const saveDay = async (event) => {
    event.preventDefault();
    if (!tour || !selected) return;
    try {
      await adminApi.put(`/availability/${tour.id}/${selected}`, editor);
      setSaved(`Saved ${selected}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetDay = async () => {
    if (!tour || !selected) return;
    if (!window.confirm('Remove the override for this date?')) return;
    try {
      await adminApi.del(`/availability/${tour.id}/${selected}`);
      setSaved('Override removed.');
      load();
      const override = overrideMap[`${tour.id}:${selected}`];
      setEditor({ capacity: tour.dailyCapacity, is_closed: false, note: override?.note || '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const applyBulk = async (event) => {
    event.preventDefault();
    try {
      await adminApi.post('/availability/bulk', {
        tourId,
        from: bulk.from || range.from,
        to: bulk.to || range.to,
        capacity: bulk.capacity,
        is_closed: bulk.is_closed,
      });
      setBulkOpen(false);
      load();
      setSaved('Bulk update applied.');
    } catch (err) {
      setError(err.message);
    }
  };

  const offset = (new Date(`${range.from}T12:00:00`).getDay() + 6) % 7;

  return (
    <>
      <PageHeader
        title="Availability"
        subtitle="Set daily capacity or close dates per tour. Pending and confirmed bookings count against capacity."
        actions={<button type="button" className="admin-btn primary" onClick={() => setBulkOpen(true)}>Bulk update</button>}
      />

      {error ? <p className="admin-error">{error}</p> : null}
      {saved ? <p className="admin-success">{saved}</p> : null}

      <div className="admin-filters">
        <select value={tourId} onChange={(event) => { setTourId(event.target.value); setSelected(''); }}>
          {tours.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button type="button" className="admin-btn ghost" onClick={() => setMonth((prev) => shiftMonth(prev, -1))}>←</button>
        <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        <button type="button" className="admin-btn ghost" onClick={() => setMonth((prev) => shiftMonth(prev, 1))}>→</button>
      </div>

      <div className="admin-grid-3">
        <section className="admin-panel span-2">
          <div className="admin-calendar">
            {WEEKDAYS.map((day) => <div key={day} className="admin-calendar-head">{day}</div>)}
            {Array.from({ length: offset }).map((_, index) => <div key={`empty-${index}`} />)}
            {Array.from({ length: range.days }).map((_, index) => {
              const day = index + 1;
              const date = `${month}-${String(day).padStart(2, '0')}`;
              const override = tour ? overrideMap[`${tour.id}:${date}`] : null;
              const capacity = override?.capacity ?? tour?.dailyCapacity ?? 8;
              const booked = tour ? bookedMap[`${tour.id}:${date}`] || 0 : 0;
              const closed = override?.isClosed;
              const full = !closed && booked >= capacity;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => selectDay(date)}
                  className={`admin-calendar-day ${selected === date ? 'selected' : ''} ${closed ? 'closed' : ''} ${full ? 'full' : ''}`}
                  disabled={!tour}
                >
                  <strong>{day}</strong>
                  <span>{closed ? 'Closed' : `${booked}/${capacity}`}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="admin-panel">
          <h2>{selected || 'Select a date'}</h2>
          {selected && tour ? (
            <form className="admin-form" onSubmit={saveDay}>
              <Field label="Capacity">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={editor.capacity}
                  onChange={(event) => setEditor((prev) => ({ ...prev, capacity: event.target.value }))}
                />
              </Field>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={editor.is_closed}
                  onChange={(event) => setEditor((prev) => ({ ...prev, is_closed: event.target.checked }))}
                />
                Close this date
              </label>
              <Field label="Note (optional)">
                <textarea
                  rows={2}
                  value={editor.note}
                  onChange={(event) => setEditor((prev) => ({ ...prev, note: event.target.value }))}
                />
              </Field>
              <p className="admin-muted">
                Booked: {bookedMap[`${tour.id}:${selected}`] || 0} guest(s). Default capacity for this tour is {tour.dailyCapacity}.
              </p>
              <div className="admin-inline">
                <button type="submit" className="admin-btn primary sm">Save date</button>
                <button type="button" className="admin-btn ghost sm" onClick={resetDay}>Reset override</button>
              </div>
            </form>
          ) : (
            <p className="admin-muted">Pick a day on the calendar to edit capacity.</p>
          )}
        </section>
      </div>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk update availability"
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setBulkOpen(false)}>Cancel</button>
            <button type="submit" form="admin-bulk-form" className="admin-btn primary">Apply</button>
          </>
        }
      >
        <form id="admin-bulk-form" className="admin-form" onSubmit={applyBulk}>
          <p className="admin-muted">Applies to the selected tour ({tour?.name || 'none'}).</p>
          <Field label="From">
            <input type="date" value={bulk.from || range.from} onChange={(event) => setBulk((prev) => ({ ...prev, from: event.target.value }))} />
          </Field>
          <Field label="To">
            <input type="date" value={bulk.to || range.to} onChange={(event) => setBulk((prev) => ({ ...prev, to: event.target.value }))} />
          </Field>
          <Field label="Capacity">
            <input type="number" min="0" max="50" value={bulk.capacity} onChange={(event) => setBulk((prev) => ({ ...prev, capacity: event.target.value }))} />
          </Field>
          <label className="admin-check">
            <input type="checkbox" checked={bulk.is_closed} onChange={(event) => setBulk((prev) => ({ ...prev, is_closed: event.target.checked }))} />
            Close these dates
          </label>
        </form>
      </Modal>
    </>
  );
}

function shiftMonth(month, delta) {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(year, number - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}