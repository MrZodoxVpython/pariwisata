import { useApp } from '../context/AppContext';
import { photoUrl } from '../lib/format';

const FALLBACK_GALLERY = [
  { id: '34997124', caption: 'Into the canyon', alt: 'A group canyoning through a rocky canyon with ropes and guides' },
  { id: '7163522', caption: 'Waterfall rappel', alt: 'A canyoning guide rappelling down a lush waterfall' },
  { id: '5741502', caption: 'Jungle pools', alt: 'A hidden waterfall and pool surrounded by dense jungle' },
  { id: '34997046', caption: 'Cave sections', alt: 'A canyoning guide descending a rope in a dramatic cave waterfall' },
  { id: '5272925', caption: 'Rope work', alt: 'A canyoning guide on a rope beside a waterfall' },
  { id: '4534200', caption: 'The descent', alt: 'A canyoning guide rappelling down a waterfall in a tropical canyon' },
];

export default function Gallery() {
  const { content, openLightbox } = useApp();
  const gallery = content.gallery.length ? content.gallery : FALLBACK_GALLERY;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <span className="kicker">Postcards from the canyon</span>
          <h1>This is what you came for.</h1>
          <p>Waterfalls, jungle pools, rope work and the faces of a very good day out.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap">
          <div className="gallery-grid">
            {gallery.map((image, index) => (
              <button className="gallery-item" key={image.id} type="button" onClick={() => openLightbox(index)} aria-label={`Open photo: ${image.caption}`}>
                <img src={photoUrl(image.id, 800)} width="800" height="600" alt={image.alt} loading="lazy" decoding="async" />
                <span>{image.caption}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}