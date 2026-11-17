import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field from '../components/Field';

const EMPTY = { question: '', answer: '', published: true };

export default function Faqs() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = () => {
    adminApi.get('/faqs').then((payload) => setRows(payload.faqs || [])).catch((err) => setError(err.message));
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
      if (editing) await adminApi.patch(`/faqs/${editing.id}`, form);
      else await adminApi.post('/faqs', form);
      setOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (row) => {
    try {
      await adminApi.patch(`/faqs/${row.id}`, { published: !row.published });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await adminApi.del(`/faqs/${row.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="FAQs"
        subtitle="Questions shown on package pages and the contact page."
        actions={<button type="button" className="admin-btn primary" onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}>Add FAQ</button>}
      />
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-panel flush">
        <DataTable
          rows={rows}
          empty="No FAQs."
          columns={[
            { key: 'question', label: 'Question', render: (value) => <strong>{value}</strong> },
            { key: 'answer', label: 'Answer', render: (value) => <span className="admin-clamp">{value}</span> },
            { key: 'sort_order', label: 'Order' },
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
        title={editing ? 'Edit FAQ' : 'Add FAQ'}
        wide
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="admin-faq-form" className="admin-btn primary">Save</button>
          </>
        }
      >
        <form id="admin-faq-form" className="admin-form" onSubmit={save}>
          <Field label="Question"><input value={form.question} onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))} required /></Field>
          <Field label="Answer"><textarea rows={5} value={form.answer} onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))} required /></Field>
          <label className="admin-check">
            <input type="checkbox" checked={Boolean(form.published)} onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))} />
            Published
          </label>
        </form>
      </Modal>
    </>
  );
}