import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field from '../components/Field';

const EMPTY = { email: '', name: '', role: 'staff', password: '', active: true };

export default function Users() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    adminApi.get('/users').then((payload) => setRows(payload.users || [])).catch((err) => setError(err.message));
  };
  useEffect(load, []);

  const edit = (row) => {
    setEditing(row);
    setForm({ ...EMPTY, ...row, password: '' });
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editing) {
        const payload = { name: form.name, role: form.role, active: form.active };
        if (form.password) payload.password = form.password;
        await adminApi.patch(`/users/${editing.id}`, payload);
      } else {
        await adminApi.post('/users', form);
      }
      setOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await adminApi.post(`/users/${resetTarget.id}/reset-password`, { password: newPassword });
      setResetTarget(null);
      setNewPassword('');
      setNotice(`Password reset for ${resetTarget.email}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete admin ${row.email}?`)) return;
    try {
      await adminApi.del(`/users/${row.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Admin users"
        subtitle="Owner-only. Roles: owner (everything), manager (content + operations), staff (bookings + messages)."
        actions={<button type="button" className="admin-btn primary" onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}>New admin</button>}
      />
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}

      <div className="admin-panel flush">
        <DataTable
          rows={rows}
          empty="No admin users."
          columns={[
            { key: 'email', label: 'Email', render: (value, row) => <div className="admin-cell-stack"><strong>{value}</strong><small>{row.name}</small></div> },
            { key: 'role', label: 'Role', render: (value) => <span className="admin-badge admin-badge-read">{value}</span> },
            { key: 'active', label: 'Status', render: (value) => <span className={`admin-badge ${value ? 'admin-badge-confirmed' : 'admin-badge-archived'}`}>{value ? 'Active' : 'Disabled'}</span> },
            { key: 'lastLoginAt', label: 'Last login', render: (value) => (value ? new Date(value).toLocaleString('en-GB') : '—') },
            {
              key: 'id',
              label: 'Actions',
              render: (_, row) => (
                <div className="admin-inline">
                  <button type="button" className="admin-btn ghost sm" onClick={() => edit(row)}>Edit</button>
                  <button type="button" className="admin-btn ghost sm" onClick={() => { setResetTarget(row); setNewPassword(''); }}>Reset password</button>
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
        title={editing ? `Edit ${editing.email}` : 'New admin user'}
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="admin-user-form" className="admin-btn primary">Save</button>
          </>
        }
      >
        <form id="admin-user-form" className="admin-form" onSubmit={save}>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} disabled={Boolean(editing)} required />
          </Field>
          <Field label="Name"><input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></Field>
          <Field label="Role">
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </Field>
          <Field label={editing ? 'New password (optional)' : 'Password'} hint="At least 8 characters.">
            <input type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} required={!editing} minLength={editing ? undefined : 8} />
          </Field>
          <label className="admin-check">
            <input type="checkbox" checked={Boolean(form.active)} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} />
            Active
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={`Reset password — ${resetTarget?.email || ''}`}
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setResetTarget(null)}>Cancel</button>
            <button type="submit" form="admin-reset-form" className="admin-btn primary">Reset</button>
          </>
        }
      >
        <form id="admin-reset-form" className="admin-form" onSubmit={resetPassword}>
          <Field label="New password" hint="This signs the user out of all sessions.">
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} />
          </Field>
        </form>
      </Modal>
    </>
  );
}