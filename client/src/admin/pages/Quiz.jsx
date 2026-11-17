import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field from '../components/Field';

const EMPTY = { key: '', question: '', options: [] };

function OptionsEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];
  const update = (index, key, text) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: text } : item)));
  };
  return (
    <div className="admin-option-editor">
      {items.map((item, index) => (
        <div className="admin-option-row" key={index}>
          <input value={item.label || ''} onChange={(event) => update(index, 'label', event.target.value)} placeholder="Label" />
          <input className="value" value={item.value || ''} onChange={(event) => update(index, 'value', event.target.value)} placeholder="value" />
          <input value={item.desc || ''} onChange={(event) => update(index, 'desc', event.target.value)} placeholder="Description" />
          <button type="button" className="admin-icon-btn danger" onClick={() => onChange(items.filter((_, i) => i !== index))}>×</button>
        </div>
      ))}
      <button type="button" className="admin-btn ghost sm" onClick={() => onChange([...items, { label: '', value: '', desc: '' }])}>
        + Add option
      </button>
    </div>
  );
}

export default function Quiz() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = () => {
    adminApi.get('/quiz').then((payload) => setRows(payload.quiz || [])).catch((err) => setError(err.message));
  };
  useEffect(load, []);

  const edit = (row) => {
    setEditing(row);
    setForm({ ...EMPTY, ...row, options: Array.isArray(row.options) ? row.options : [] });
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editing) await adminApi.patch(`/quiz/${editing.id}`, form);
      else await adminApi.post('/quiz', form);
      setOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await adminApi.del(`/quiz/${row.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Canyon matcher"
        subtitle="Questions and answer options used by the quiz dialog."
        actions={<button type="button" className="admin-btn primary" onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}>Add question</button>}
      />
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-panel flush">
        <DataTable
          rows={rows}
          empty="No quiz questions."
          columns={[
            { key: 'question', label: 'Question', render: (value) => <strong>{value}</strong> },
            { key: 'key', label: 'Key' },
            { key: 'options', label: 'Options', render: (value) => `${(value || []).length} option(s)` },
            { key: 'sort_order', label: 'Order' },
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
        title={editing ? 'Edit question' : 'Add question'}
        wide
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="admin-quiz-form" className="admin-btn primary">Save</button>
          </>
        }
      >
        <form id="admin-quiz-form" className="admin-form" onSubmit={save}>
          <Field label="Question"><input value={form.question} onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))} required /></Field>
          <Field label="Key" hint="Stable identifier used by the scoring logic, e.g. thrill.">
            <input value={form.key || ''} onChange={(event) => setForm((prev) => ({ ...prev, key: event.target.value }))} />
          </Field>
          <Field label="Options"><OptionsEditor value={form.options} onChange={(options) => setForm((prev) => ({ ...prev, options }))} /></Field>
        </form>
      </Modal>
    </>
  );
}