import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field from '../components/Field';
import { formatMoney } from '../../lib/format';

const EMPTY = { id: '', label: '', fee: 0, active: true };

export default function Pickups() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = () => {
    adminApi.get('/pickups').then((payload) => setRows(payload.pickups || [])).catch((err) => setError(err.message));
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
      if (editing) await adminApi.patch(`/pickups/${editing.id}`, form);
      else await adminApi.post('/pickups', form);
      setOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivate = async (row) => {
    if (!window.confirm(`Deactivate "${row.label}"?`)) return;
    try {
      await adminApi.del(`/pickups/${row.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Pickup points"
        subtitle="Pickup areas and their surcharge, shown in the booking form."
        actions={<button type="button" className="admin-btn primary" onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}>New pickup</button>}
      />
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-panel flush">
        <DataTable
          rows={rows}
          empty="No pickup points."
          columns={[
            { key: 'label', label: 'Label' },
            { key: 'id', label: 'Id' },
            { key: 'fee', label: 'Fee', render: (value) => formatMoney(value) },
            { key: 'sort_order', label: 'Order' },
            { key: 'active', label: 'Status', render: (value) => <span className={`admin-badge ${value ? 'admin-badge-confirmed' : 'admin-badge-archived'}`}>{value ? 'Active' : 'Inactive'}</span> },
            {
              key: 'id',
              label: 'Actions',
              render: (_, row) => (
                <div className="admin-inline">
                  <button type="button" className="admin-btn ghost sm" onClick={() => edit(row)}>Edit</button>
                  {row.active ? <button type="button" className="admin-btn ghost sm danger" onClick={() => deactivate(row)}>Deactivate</button> : null}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.label}` : 'New pickup point'}
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="admin-pickup-form" className="admin-btn primary">Save</button>
          </>
        }
      >
        <form id="admin-pickup-form" className="admin-form" onSubmit={save}>
          {editing ? null : (
            <Field label="Id" hint="Optional. Generated from the label when empty.">
              <input value={form.id} onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))} />
            </Field>
          )}
          <Field label="Label"><input value={form.label} onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))} required /></Field>
          <Field label="Fee (IDR)"><input type="number" min="0" value={form.fee} onChange={(event) => setForm((prev) => ({ ...prev, fee: event.target.value }))} /></Field>
          <label className="admin-check">
            <input type="checkbox" checked={Boolean(form.active)} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} />
            Active (shown to guests)
          </label>
        </form>
      </Modal>
    </>
  );
}