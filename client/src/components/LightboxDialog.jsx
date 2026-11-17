import { useEffect, useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { photoUrl } from '../lib/format';

export default function LightboxDialog() {
  const { lightboxIndex, closeLightbox, content } = useApp();
  const gallery = content.gallery;
  const open = lightboxIndex !== null;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (lightboxIndex !== null) setIndex(lightboxIndex);
  }, [lightboxIndex]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIndex((current) => (current + 1) % gallery.length);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIndex((current) => (current - 1 + gallery.length) % gallery.length);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, gallery.length]);

  const image = gallery[index];

  return (
    <Dialog open={open} onClose={closeLightbox} className="lightbox-dialog" labelledBy="lightboxCaption">
      <div className="lightbox-card">
        <button className="dialog-close lightbox-close" type="button" onClick={closeLightbox} aria-label="Close photo"><Icon name="close" /></button>
        <button className="lightbox-nav lightbox-prev" type="button" onClick={() => setIndex((current) => (current - 1 + gallery.length) % gallery.length)} aria-label="Previous photo"><Icon name="left" /></button>
        <img id="lightboxImg" src={photoUrl(image?.id, 1600)} alt={image?.alt || ''} />
        <button className="lightbox-nav lightbox-next" type="button" onClick={() => setIndex((current) => (current + 1) % gallery.length)} aria-label="Next photo"><Icon name="right" /></button>
        <div className="lightbox-caption"><span id="lightboxCaption">{image?.caption || ''}</span><span id="lightboxCount">{index + 1} / {gallery.length}</span></div>
      </div>
    </Dialog>
  );
}