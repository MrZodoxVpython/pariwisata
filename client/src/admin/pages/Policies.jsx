import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import Field from '../components/Field';
import HtmlEditor from '../components/HtmlEditor';

const ORDER = ['privacy', 'terms', 'cancellation'];
const LABELS = { privacy: 'Privacy policy', terms: 'Terms & conditions', cancellation: 'Cancellation & weather' };

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [active, setActive] = useState('privacy');
  const [form, setForm] = useState({ title: '', html: '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    adminApi
      .get('/policies')
      .then((payload) => {
        const rows = payload.policies || [];
        setPolicies(rows);
        const current = rows.find((item) => item.slug === active) || rows[0];
        if (current) setForm({ title: current.title, html: current.html });
      })
      .catch((err) => setError(err.message));
  };
  useEffect(load, []);

  const select = (slug) => {
    setActive(slug);
    setSaved('');
    const current = policies.find((item) => item.slug === slug);
    if (current) setForm({ title: current.title, html: current.html });
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved('');
    try {
      await adminApi.put(`/policies/${active}`, form);
      setSaved(`${LABELS[active]} saved.`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Policies" subtitle="Legal and policy pages linked in the footer." />
      {error ? <p className="admin-error">{error}</p> : null}
      {saved ? <p className="admin-success">{saved}</p> : null}

      <div className="admin-tabs">
        {ORDER.map((slug) => (
          <button key={slug} type="button" className={active === slug ? 'active' : ''} onClick={() => select(slug)}>
            {LABELS[slug]}
          </button>
        ))}
      </div>

      <form className="admin-form" onSubmit={save}>
        <section className="admin-panel">
          <Field label="Page title">
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
          </Field>
          <Field label="Content">
            <HtmlEditor value={form.html} onChange={(html) => setForm((prev) => ({ ...prev, html }))} rows={20} />
          </Field>
          <button type="submit" className="admin-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save policy'}</button>
        </section>
      </form>
    </>
  );
}