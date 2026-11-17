import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field from '../components/Field';

const EMPTY = {
  name: '',
  country: '',
  date_label: new Date().toISOString().slice(0, 10),
  tour: '',
  rating: 5,
  source: 'Google',
  initials: '',
  color: '#0093DD',
  quote: '',
  published: true,
};

export default function Reviews() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = () => {
    adminApi.get('/reviews').then((payload) => setRows(payload.reviews || [])).catch((err) => setError(err.message));
  };
  useEffect(load, []);

  const edit = (row) => {
    setEditing(row);
    setForm({ ...EMPTY, ...row });
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editing) await adminApi.patch(`/reviews/${editing.id}`, form);
      else await adminApi.post('/reviews', form);
      setOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (row) => {
    try {
      await adminApi.patch(`/reviews/${row.id}`, { published: !row.published });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete the review from ${row.name}?`)) return;
    try {
      await adminApi.del(`/reviews/${row.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="Guest reviews shown on the home page and packages."
        actions={<button type="button" className="admin-btn primary" onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}>Add review</button>}
      />
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-panel flush">
        <DataTable
          rows={rows}
          empty="No reviews."
          columns={[
            { key: 'name', label: 'Guest', render: (value, row) => <div className="admin-cell-stack"><strong>{value}</strong><small>{row.country}</small></div> },
            { key: 'tour', label: 'Tour' },
            { key: 'rating', label: 'Rating', render: (value) => '★'.repeat(value) },
            { key: 'source', label: 'Source' },
            { key: 'date_label', label: 'Date' },
            { key: 'published', label: 'Status', render: (value) => <span className={`admin-badge ${value ? 'admin-badge-confirmed' : 'admin-badge-archived'}`}>{value ? 'Published' : 'Hidden'}</span> },
            {
              key: 'id',
              label: 'Actions',
              render: (_, row) => (
                <div className="admin-inline">
                  <button type="button" className="admin-btn ghost sm" onClick={() => edit(row)}>Edit</button>
                  <button type="button" className="admin-btn ghost sm" onClick={() => toggle(row)}>{row.published ? 'Hide' : 'Publish'}</button>
                  <button type="button" className="admin-btn ghost sm danger" onClick={() => remove(row)}>Delete</button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit review' : 'Add review'}
        wide
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="admin-review-form" className="admin-btn primary">Save</button>
          </>
        }
      >
        <form id="admin-review-form" className="admin-form grid" onSubmit={save}>
          <Field label="Guest name"><input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required /></Field>
          <Field label="Country"><input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} required /></Field>
          <Field label="Tour"><input value={form.tour} onChange={(event) => setForm((prev) => ({ ...prev, tour: event.target.value }))} required /></Field>
          <Field label="Date label" hint="Free text, e.g. 2 weeks ago."><input value={form.date_label} onChange={(event) => setForm((prev) => ({ ...prev, date_label: event.target.value }))} /></Field>
          <Field label="Rating">
            <select value={form.rating} onChange={(event) => setForm((prev) => ({ ...prev, rating: event.target.value }))}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} ★</option>)}
            </select>
          </Field>
          <Field label="Source"><input value={form.source || ''} onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))} /></Field>
          <Field label="Initials"><input value={form.initials || ''} onChange={(event) => setForm((prev) => ({ ...prev, initials: event.target.value }))} /></Field>
          <Field label="Avatar color"><input type="color" value={form.color || '#0093DD'} onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))} /></Field>
          <Field label="Quote" className="span-2"><textarea rows={4} value={form.quote} onChange={(event) => setForm((prev) => ({ ...prev, quote: event.target.value }))} required /></Field>
          <label className="admin-check span-2">
            <input type="checkbox" checked={Boolean(form.published)} onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))} />
            Published
          </label>
        </form>
      </Modal>
    </>
  );
}