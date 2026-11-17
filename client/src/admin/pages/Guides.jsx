import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field from '../components/Field';

const EMPTY = {
  name: '',
  role: 'Canyon guide',
  years: '',
  bio: '',
  languages: 'English · Indonesian',
  initials: '',
  color: '#0077B6',
};

export default function Guides() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = () => {
    adminApi.get('/guides').then((payload) => setRows(payload.guides || [])).catch((err) => setError(err.message));
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
      if (editing) await adminApi.patch(`/guides/${editing.id}`, form);
      else await adminApi.post('/guides', form);
      setOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete guide ${row.name}?`)) return;
    try {
      await adminApi.del(`/guides/${row.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Guides"
        subtitle="Team profiles shown on the About page."
        actions={<button type="button" className="admin-btn primary" onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}>Add guide</button>}
      />
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-panel flush">
        <DataTable
          rows={rows}
          empty="No guides."
          columns={[
            { key: 'name', label: 'Name', render: (value, row) => <div className="admin-cell-stack"><strong>{value}</strong><small>{row.initials}</small></div> },
            { key: 'role', label: 'Role' },
            { key: 'years', label: 'Experience' },
            { key: 'languages', label: 'Languages' },
            {
              key: 'id',
              label: 'Actions',
              render: (_, row) => (
                <div className="admin-inline">
                  <button type="button" className="admin-btn ghost sm" onClick={() => edit(row)}>Edit</button>
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
        title={editing ? `Edit ${editing.name}` : 'Add guide'}
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="admin-guide-form" className="admin-btn primary">Save</button>
          </>
        }
      >
        <form id="admin-guide-form" className="admin-form" onSubmit={save}>
          <Field label="Name"><input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required /></Field>
          <Field label="Role"><input value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} /></Field>
          <Field label="Experience"><input value={form.years || ''} onChange={(event) => setForm((prev) => ({ ...prev, years: event.target.value }))} placeholder="10 years" /></Field>
          <Field label="Languages"><input value={form.languages || ''} onChange={(event) => setForm((prev) => ({ ...prev, languages: event.target.value }))} /></Field>
          <Field label="Initials"><input value={form.initials || ''} onChange={(event) => setForm((prev) => ({ ...prev, initials: event.target.value }))} maxLength={4} /></Field>
          <Field label="Avatar color"><input type="color" value={form.color || '#0077B6'} onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))} /></Field>
          <Field label="Bio"><textarea rows={4} value={form.bio || ''} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} /></Field>
        </form>
      </Modal>
    </>
  );
}