import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import Field from '../components/Field';

const FIELDS = [
  ['name', 'Site / brand name'],
  ['url', 'Website URL'],
  ['phone', 'Phone (display)'],
  ['phone_href', 'Phone (digits for links)'],
  ['email', 'Public email'],
  ['address', 'Address'],
  ['hours', 'Opening hours'],
  ['instagram', 'Instagram URL'],
  ['facebook', 'Facebook URL'],
  ['whatsapp', 'WhatsApp link (https://wa.me/…)'],
  ['currency', 'Default currency'],
  ['map_url', 'Map URL'],
];

export default function Settings() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .get('/settings')
      .then((payload) => setForm(payload.settings || {}))
      .catch((err) => setError(err.message));
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved('');
    try {
      await adminApi.put('/settings', form);
      setSaved('Settings saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!form) return <div className="admin-panel"><p className="admin-muted">Loading settings…</p></div>;

  return (
    <>
      <PageHeader title="Site settings" subtitle="Contact details, social links and announcements used across the website." />
      {error ? <p className="admin-error">{error}</p> : null}
      {saved ? <p className="admin-success">{saved}</p> : null}

      <form className="admin-form" onSubmit={save}>
        <section className="admin-panel">
          <h2>Brand & contact</h2>
          <div className="admin-grid-2 form">
            {FIELDS.map(([key, label]) => (
              <Field key={key} label={label}>
                <input value={form[key] || ''} onChange={(event) => set(key, event.target.value)} />
              </Field>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <h2>Announcement banner</h2>
          <Field label="Announcement text" hint="Shown at the top of the public site when enabled.">
            <textarea rows={2} value={form.announcement || ''} onChange={(event) => set('announcement', event.target.value)} />
          </Field>
          <label className="admin-check">
            <input type="checkbox" checked={Boolean(form.announcement_active)} onChange={(event) => set('announcement_active', event.target.checked)} />
            Show announcement banner
          </label>
        </section>

        <section className="admin-panel">
          <h2>New booking notifications</h2>
          <p className="admin-muted">Notifications are queued and sent by the notification worker. Email needs RESEND_API_KEY; WhatsApp needs FONNTE_TOKEN (server environment variables).</p>
          <div className="admin-grid-2 form">
            <Field label="Notify email" hint="Receives new booking and contact alerts.">
              <input type="email" value={form.notify_email || ''} onChange={(event) => set('notify_email', event.target.value)} />
            </Field>
            <Field label="Notify WhatsApp" hint="Phone number that receives alerts, e.g. 6281339578001.">
              <input value={form.notify_whatsapp || ''} onChange={(event) => set('notify_whatsapp', event.target.value)} />
            </Field>
          </div>
        </section>

        <div className="admin-sticky-actions">
          <button type="submit" className="admin-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
        </div>
      </form>
    </>
  );
}