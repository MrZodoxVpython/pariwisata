import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import Field from '../components/Field';
import HtmlEditor from '../components/HtmlEditor';
import ImagePicker from '../components/ImagePicker';
import Modal from '../components/Modal';
import { photoUrl } from '../../lib/format';

const EMPTY = {
  slug: '',
  kicker: 'Journal',
  title: '',
  meta: '',
  image_id: '',
  body: '',
  published: false,
};

export default function ArticleForm() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isNew = slug === 'new';
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY);
      setLoading(false);
      return;
    }
    adminApi
      .get(`/articles/${slug}`)
      .then((payload) => setForm({ ...EMPTY, ...payload.article }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, isNew]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved('');
    try {
      if (isNew) {
        const payload = await adminApi.post('/articles', form);
        navigate(`/admin/articles/${payload.article.slug}`, { replace: true });
      } else {
        await adminApi.patch(`/articles/${slug}`, form);
        setSaved('Article saved.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${form.title}"?`)) return;
    try {
      await adminApi.del(`/articles/${slug}`);
      navigate('/admin/articles');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="admin-panel"><p className="admin-muted">Loading article…</p></div>;

  return (
    <>
      <PageHeader
        title={isNew ? 'New article' : `Edit — ${form.title}`}
        subtitle="HTML is sanitised on save. Use the toolbar or write HTML directly."
        actions={
          <>
            <Link className="admin-btn ghost" to="/admin/articles">← All articles</Link>
            <button type="button" className="admin-btn ghost" onClick={() => setPreview(true)}>Preview</button>
            {!isNew && form.published ? <a className="admin-btn ghost" href={`/articles/${slug}`} target="_blank" rel="noreferrer">View live ↗</a> : null}
          </>
        }
      />
      {error ? <p className="admin-error">{error}</p> : null}
      {saved ? <p className="admin-success">{saved}</p> : null}

      <form className="admin-form" onSubmit={save}>
        <section className="admin-panel">
          <div className="admin-grid-2 form">
            {isNew ? (
              <Field label="Slug" hint="Optional — generated from the title when empty.">
                <input value={form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="first-canyon" />
              </Field>
            ) : (
              <Field label="Slug"><input value={form.slug} disabled /></Field>
            )}
            <Field label="Kicker"><input value={form.kicker || ''} onChange={(event) => set('kicker', event.target.value)} /></Field>
            <Field label="Title" className="span-2"><input value={form.title} onChange={(event) => set('title', event.target.value)} required /></Field>
            <Field label="Meta line" className="span-2" hint="Shown under the title, e.g. 12 Nov 2026 · 5 min read.">
              <input value={form.meta || ''} onChange={(event) => set('meta', event.target.value)} />
            </Field>
          </div>
          <ImagePicker label="Cover image" value={form.image_id || ''} onChange={(value) => set('image_id', value)} />
          <label className="admin-check">
            <input type="checkbox" checked={Boolean(form.published)} onChange={(event) => set('published', event.target.checked)} />
            Published
          </label>
        </section>

        <section className="admin-panel">
          <h2>Body</h2>
          <HtmlEditor value={form.body} onChange={(value) => set('body', value)} rows={22} />
        </section>

        <div className="admin-sticky-actions">
          {!isNew ? <button type="button" className="admin-btn ghost danger" onClick={remove}>Delete</button> : null}
          <Link className="admin-btn ghost" to="/admin/articles">Cancel</Link>
          <button type="submit" className="admin-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save article'}</button>
        </div>
      </form>

      <Modal open={preview} onClose={() => setPreview(false)} title={form.title || 'Preview'} wide>
        <article className="admin-article-preview">
          {form.image_id ? <img src={photoUrl(form.image_id, 1000)} alt="" /> : null}
          <p className="admin-muted">{form.meta}</p>
          <div dangerouslySetInnerHTML={{ __html: form.body }} />
        </article>
      </Modal>
    </>
  );
}