import { useEffect, useRef, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Field from '../components/Field';
import { photoUrl } from '../../lib/format';

export default function Gallery() {
  const [rows, setRows] = useState([]);
  const [tech, setTech] = useState({ configured: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ id: '', caption: '', alt: '' });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ caption: '', alt: '' });
  const fileRef = useRef(null);

  const load = () => {
    adminApi
      .get('/gallery')
      .then((payload) => setRows(payload.gallery || []))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    adminApi.get('/media/config').then(setTech).catch(() => {});
  }, []);

  const add = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.post('/gallery', addForm);
      setAddOpen(false);
      setAddForm({ id: '', caption: '', alt: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const media = await adminApi.uploadImage(file);
      await adminApi.post('/gallery', { id: media.url, caption: media.caption || '', alt: media.alt || '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      await adminApi.patch(`/gallery/${encodeURIComponent(editing.id)}`, editForm);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm('Remove this image from the gallery?')) return;
    try {
      await adminApi.del(`/gallery/${encodeURIComponent(row.id)}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    try {
      await adminApi.post('/gallery/reorder', { ids: next.map((item) => item.id) });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Photos shown on the home page and gallery page."
        actions={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setAddOpen(true)}>Add by URL</button>
            <label className={`admin-btn primary ${!tech.configured || busy ? 'disabled' : ''}`}>
              {busy ? 'Uploading…' : 'Upload image'}
              <input ref={fileRef} type="file" accept="image/*" hidden disabled={!tech.configured || busy} onChange={upload} />
            </label>
          </>
        }
      />
      {error ? <p className="admin-error">{error}</p> : null}
      {!tech.configured ? (
        <p className="admin-note">Storage is not configured — add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable uploads. You can still add images by URL or Pexels id.</p>
      ) : null}

      <div className="admin-gallery-grid">
        {rows.map((row, index) => (
          <div className="admin-gallery-card" key={row.id}>
            <img src={photoUrl(row.id, 500)} alt={row.alt || ''} loading="lazy" />
            <div className="admin-gallery-meta">
              <strong>{row.caption || 'Untitled'}</strong>
              <small>{row.id}</small>
            </div>
            <div className="admin-gallery-actions">
              <button type="button" className="admin-icon-btn" onClick={() => move(index, -1)} title="Move up">↑</button>
              <button type="button" className="admin-icon-btn" onClick={() => move(index, 1)} title="Move down">↓</button>
              <button type="button" className="admin-btn ghost sm" onClick={() => { setEditing(row); setEditForm({ caption: row.caption || '', alt: row.alt || '' }); }}>Edit</button>
              <button type="button" className="admin-btn ghost sm danger" onClick={() => remove(row)}>Delete</button>
            </div>
          </div>
        ))}
        {rows.length === 0 ? <p className="admin-muted">Gallery is empty.</p> : null}
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add gallery image"
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="submit" form="admin-gallery-add" className="admin-btn primary" disabled={busy}>Add</button>
          </>
        }
      >
        <form id="admin-gallery-add" className="admin-form" onSubmit={add}>
          <Field label="Image id or URL" hint="Pexels id (5741502), https URL, or /assets path.">
            <input value={addForm.id} onChange={(event) => setAddForm((prev) => ({ ...prev, id: event.target.value }))} required />
          </Field>
          <Field label="Caption"><input value={addForm.caption} onChange={(event) => setAddForm((prev) => ({ ...prev, caption: event.target.value }))} /></Field>
          <Field label="Alt text"><input value={addForm.alt} onChange={(event) => setAddForm((prev) => ({ ...prev, alt: event.target.value }))} /></Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit image details"
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" form="admin-gallery-edit" className="admin-btn primary">Save</button>
          </>
        }
      >
        <form id="admin-gallery-edit" className="admin-form" onSubmit={saveEdit}>
          {editing ? <img className="admin-edit-preview" src={photoUrl(editing.id, 500)} alt="" /> : null}
          <Field label="Caption"><input value={editForm.caption} onChange={(event) => setEditForm((prev) => ({ ...prev, caption: event.target.value }))} /></Field>
          <Field label="Alt text"><input value={editForm.alt} onChange={(event) => setEditForm((prev) => ({ ...prev, alt: event.target.value }))} /></Field>
        </form>
      </Modal>
    </>
  );
}