import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import Field from '../components/Field';
import ListEditor from '../components/ListEditor';
import ItineraryEditor from '../components/ItineraryEditor';
import ImagePicker from '../components/ImagePicker';
import { photoUrl } from '../../lib/format';

const EMPTY = {
  id: '',
  name: '',
  short: '',
  level: 'Beginner',
  level_key: 'beginner',
  badge: '',
  badge_class: '',
  duration: 'Full day',
  min_age: 8,
  max_weight: 120,
  swim: 'Optional',
  jumps: '',
  slides: '',
  group_size: 'Max 8 guests',
  price: 0,
  image: '',
  gallery_ids: [],
  best_for: '',
  long_description: '',
  itinerary: [],
  inclusions: [],
  exclusions: [],
  requirements: [],
  bring: [],
  meeting: '',
  cancellation: '',
  daily_capacity: 8,
  sort_order: 0,
  active: true,
};

export default function TourForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY);
      setLoading(false);
      return;
    }
    adminApi
      .get(`/tours/${id}`)
      .then((payload) => setForm({ ...EMPTY, ...payload.tour }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved('');
    try {
      if (isNew) {
        const payload = await adminApi.post('/tours', form);
        navigate(`/admin/tours/${payload.tour.id}`, { replace: true });
      } else {
        await adminApi.patch(`/tours/${id}`, form);
        setSaved('Tour saved.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="admin-panel"><p className="admin-muted">Loading tour…</p></div>;

  return (
    <>
      <PageHeader
        title={isNew ? 'New tour' : `Edit — ${form.name}`}
        subtitle="Everything here is published to the public package pages."
        actions={
          <>
            <Link className="admin-btn ghost" to="/admin/tours">← All tours</Link>
            {!isNew && form.active ? <a className="admin-btn ghost" href={`/packages/${form.id}`} target="_blank" rel="noreferrer">Preview ↗</a> : null}
          </>
        }
      />

      {error ? <p className="admin-error">{error}</p> : null}
      {saved ? <p className="admin-success">{saved}</p> : null}

      <form className="admin-form" onSubmit={save}>
        <section className="admin-panel">
          <h2>Basic information</h2>
          <div className="admin-grid-2 form">
            {isNew ? (
              <Field label="Tour id" hint="Lowercase slug, e.g. egar. Used in URLs.">
                <input value={form.id} onChange={(event) => set('id', event.target.value)} required />
              </Field>
            ) : (
              <Field label="Tour id"><input value={form.id} disabled /></Field>
            )}
            <Field label="Name"><input value={form.name} onChange={(event) => set('name', event.target.value)} required /></Field>
            <Field label="Short description" className="span-2">
              <textarea rows={2} value={form.short} onChange={(event) => set('short', event.target.value)} required />
            </Field>
            <Field label="Level">
              <select value={form.level} onChange={(event) => { set('level', event.target.value); set('level_key', event.target.value.toLowerCase()); }}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </Field>
            <Field label="Duration"><input value={form.duration} onChange={(event) => set('duration', event.target.value)} /></Field>
            <Field label="Badge"><input value={form.badge || ''} onChange={(event) => set('badge', event.target.value)} placeholder="Most popular" /></Field>
            <Field label="Badge style">
              <select value={form.badge_class || ''} onChange={(event) => set('badge_class', event.target.value)}>
                <option value="">None</option>
                <option value="lime">Lime</option>
                <option value="light">Light</option>
                <option value="gold">Gold</option>
              </select>
            </Field>
            <Field label="Best for" className="span-2"><input value={form.best_for || ''} onChange={(event) => set('best_for', event.target.value)} /></Field>
            <Field label="Long description" className="span-2">
              <textarea rows={4} value={form.long_description || ''} onChange={(event) => set('long_description', event.target.value)} />
            </Field>
          </div>
        </section>

        <section className="admin-panel">
          <h2>Pricing & capacity</h2>
          <div className="admin-grid-2 form">
            <Field label="Price per person (IDR)">
              <input type="number" min="0" value={form.price} onChange={(event) => set('price', event.target.value)} required />
            </Field>
            <Field label="Daily capacity" hint="Used by the public booking availability check.">
              <input type="number" min="0" max="50" value={form.daily_capacity} onChange={(event) => set('daily_capacity', event.target.value)} />
            </Field>
            <Field label="Minimum age"><input type="number" min="0" value={form.min_age} onChange={(event) => set('min_age', event.target.value)} /></Field>
            <Field label="Maximum weight (kg)"><input type="number" min="0" value={form.max_weight} onChange={(event) => set('max_weight', event.target.value)} /></Field>
            <Field label="Group size"><input value={form.group_size} onChange={(event) => set('group_size', event.target.value)} /></Field>
            <Field label="Swim requirement"><input value={form.swim} onChange={(event) => set('swim', event.target.value)} /></Field>
            <Field label="Jumps"><input value={form.jumps || ''} onChange={(event) => set('jumps', event.target.value)} /></Field>
            <Field label="Slides"><input value={form.slides || ''} onChange={(event) => set('slides', event.target.value)} /></Field>
            <Field label="Sort order"><input type="number" value={form.sort_order} onChange={(event) => set('sort_order', event.target.value)} /></Field>
            <label className="admin-check">
              <input type="checkbox" checked={Boolean(form.active)} onChange={(event) => set('active', event.target.checked)} />
              Visible on the public site
            </label>
          </div>
        </section>

        <section className="admin-panel">
          <h2>Media</h2>
          <ImagePicker label="Hero image" value={form.image} onChange={(value) => set('image', value)} />
          <Field label="Gallery images" hint="One Pexels id, URL or /assets path per line.">
            <ListEditor value={form.gallery_ids} onChange={(value) => set('gallery_ids', value)} placeholder="5741502 or https://…" />
          </Field>
          {form.gallery_ids?.length ? (
            <div className="admin-thumb-row">
              {form.gallery_ids.map((imageId) => (
                <img key={imageId} src={photoUrl(imageId, 200)} alt="" />
              ))}
            </div>
          ) : null}
        </section>

        <section className="admin-panel">
          <h2>Itinerary & details</h2>
          <Field label="Itinerary steps"><ItineraryEditor value={form.itinerary} onChange={(value) => set('itinerary', value)} /></Field>
          <div className="admin-grid-2 form">
            <Field label="Inclusions"><ListEditor value={form.inclusions} onChange={(value) => set('inclusions', value)} multiline /></Field>
            <Field label="Exclusions"><ListEditor value={form.exclusions} onChange={(value) => set('exclusions', value)} multiline /></Field>
            <Field label="Requirements"><ListEditor value={form.requirements} onChange={(value) => set('requirements', value)} multiline /></Field>
            <Field label="What to bring"><ListEditor value={form.bring} onChange={(value) => set('bring', value)} multiline /></Field>
            <Field label="Meeting point"><input value={form.meeting || ''} onChange={(event) => set('meeting', event.target.value)} /></Field>
            <Field label="Cancellation note"><textarea rows={3} value={form.cancellation || ''} onChange={(event) => set('cancellation', event.target.value)} /></Field>
          </div>
        </section>

        <div className="admin-sticky-actions">
          <Link className="admin-btn ghost" to="/admin/tours">Cancel</Link>
          <button type="submit" className="admin-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save tour'}</button>
        </div>
      </form>
    </>
  );
}