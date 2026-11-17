import { useApp } from '../context/AppContext';
import { photoUrl } from '../lib/format';

export default function Gallery() {
  const { content } = useApp();

  return (
    <section className="section" aria-labelledby="gallery-h2">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 data-reveal">
          <div className="kicker"><span className="icon">📸</span>Gallery</div>
          <h2 id="gallery-h2">Canyon moments</h2>
          <p className="lead mx-auto">Photos from real tours with our guests and guides across North Bali&apos;s canyons.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {content.gallery.map((image) => (
            <figure key={image.id} className="relative aspect-square rounded-xl overflow-hidden shadow-sm group border border-solid m-0" style={{ borderColor: 'var(--line)' }}>
              <img src={photoUrl(image.id, 800)} alt={image.alt || image.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <figcaption className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                <span className="text-sm font-bold text-white">{image.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}