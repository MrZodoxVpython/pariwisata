import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import adminApi from '../api';
import { photoUrl } from '../../lib/format';

export default function ImagePicker({ value = '', onChange, label = 'Image' }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('library');
  const [media, setMedia] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [config, setConfig] = useState({ configured: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      adminApi.get('/media?limit=60'),
      adminApi.get('/gallery'),
      adminApi.get('/media/config'),
    ])
      .then(([mediaPayload, galleryPayload, configPayload]) => {
        if (!active) return;
        setMedia(mediaPayload.media || []);
        setGallery(galleryPayload.gallery || []);
        setConfig(configPayload);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open]);

  const choose = (next) => {
    onChange(next);
    setOpen(false);
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const item = await adminApi.uploadImage(file);
      setMedia((prev) => [item, ...prev]);
      choose(item.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="admin-image-picker">
      <span className="admin-image-label">{label}</span>
      <div className="admin-image-current">
        <div className="admin-image-thumb">
          {value ? <img src={photoUrl(value, 400)} alt="" /> : <span>No image</span>}
        </div>
        <div className="admin-image-actions">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Image URL, Pexels id or /assets path"
          />
          <button type="button" className="admin-btn ghost sm" onClick={() => setOpen(true)}>
            Choose image
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Choose an image" wide>
        <div className="admin-tabs">
          <button type="button" className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>
            Media library
          </button>
          <button type="button" className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>
            Gallery
          </button>
          <button type="button" className={tab === 'upload' ? 'active' : ''} onClick={() => setTab('upload')}>
            Upload
          </button>
          <button type="button" className={tab === 'url' ? 'active' : ''} onClick={() => setTab('url')}>
            URL
          </button>
        </div>

        {error ? <p className="admin-error">{error}</p> : null}

        {tab === 'library' ? (
          <div className="admin-media-grid">
            {loading ? <p className="admin-muted">Loading…</p> : null}
            {!loading && media.length === 0 ? (
              <p className="admin-muted">
                No media yet. Use the Upload tab{config.configured ? '' : ' (storage not configured)'}.
              </p>
            ) : null}
            {media.map((item) => (
              <button key={item.id} type="button" className="admin-media-cell" onClick={() => choose(item.url)}>
                <img src={item.url} alt={item.alt || ''} loading="lazy" />
                <span>{item.caption || item.path}</span>
              </button>
            ))}
          </div>
        ) : null}

        {tab === 'gallery' ? (
          <div className="admin-media-grid">
            {gallery.map((item) => (
              <button key={item.id} type="button" className="admin-media-cell" onClick={() => choose(item.id)}>
                <img src={photoUrl(item.id, 400)} alt={item.alt || ''} loading="lazy" />
                <span>{item.caption || item.id}</span>
              </button>
            ))}
            {gallery.length === 0 ? <p className="admin-muted">Gallery is empty.</p> : null}
          </div>
        ) : null}

        {tab === 'upload' ? (
          <div className="admin-upload-panel">
            <p className="admin-muted">
              Images are compressed in the browser and uploaded to Supabase Storage.
              {config.configured ? '' : ' Storage is not configured yet — add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'}
            </p>
            <input ref={fileRef} type="file" accept="image/*" onChange={upload} disabled={!config.configured || loading} />
          </div>
        ) : null}

        {tab === 'url' ? (
          <div className="admin-upload-panel">
            <p className="admin-muted">Paste an image URL, a Pexels photo id, or a local path such as /assets/tours/egar.webp.</p>
            <div className="admin-inline">
              <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" />
              <button type="button" className="admin-btn primary" onClick={() => url && choose(url)}>
                Use URL
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}