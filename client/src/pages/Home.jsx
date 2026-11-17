import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Sparkles, Star } from 'lucide-react';
import Hero from '../components/Hero';
import { useApp } from '../context/AppContext';
import { formatIDR, photoUrl, tourImage } from '../lib/format';

export default function Home() {
  const { content, openBooking, openQuiz } = useApp();
  const [activePickup, setActivePickup] = useState(content.pickups[0]?.id || '');
  const { tours, pickups, reviews, guides, gallery, faqs } = content;

  return (
    <>
      <Hero />

      <section className="section" aria-labelledby="tours-h2">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 data-reveal">
            <div className="kicker"><span className="icon">⛰️</span>Our tours</div>
            <h2>Choose your canyon adventure</h2>
            <p className="lead mx-auto">Four canyons in North Bali, each with a different character. All guided by local experts with full safety gear.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tours.map((tour) => (
              <article key={tour.id} className="bg-white rounded-2xl border border-solid overflow-hidden hover:shadow transition-shadow flex flex-col" style={{ borderColor: 'var(--line)' }}>
                <Link to={`/packages/${tour.id}`} className="block relative h-48 overflow-hidden no-underline">
                  <img src={tourImage(tour, 600)} alt={tour.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <span className="absolute top-3 left-3 badge light">{tour.badge || tour.level}</span>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-lg font-bold m-0" style={{ color: 'var(--brand-dark)' }}>{tour.name}</h3>
                    <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--sky)' }}>{formatIDR(tour.price)}</span>
                  </div>
                  <p className="text-xs mb-4 line-clamp-2" style={{ color: 'var(--muted)' }}>{tour.short}</p>
                  <div className="flex flex-wrap gap-2 text-xs mb-5">
                    <span className="px-2 py-1 rounded bg-[#eef6fb] text-[#0f6b9e] font-bold">{tour.level}</span>
                    <span className="px-2 py-1 rounded bg-[#eef6fb] text-[#0f6b9e] font-bold">{tour.duration}</span>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Link to={`/packages/${tour.id}`} className="btn-ghost btn-sm flex-1 text-center no-underline">Details</Link>
                    <button type="button" onClick={() => openBooking(tour.id)} className="btn-primary btn-sm flex-1">Book</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-10">
            <button type="button" onClick={openQuiz} className="btn-ghost inline-flex items-center gap-2">
              <Sparkles size={16} /> Not sure? Match me with a canyon
            </button>
          </div>
        </div>
      </section>

      <section className="section bg-[#f7f9fa] border-y border-solid" style={{ borderColor: 'var(--line)' }} aria-labelledby="pickup-h2">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="data-reveal">
              <h2>Hotel pickup &amp; meeting points</h2>
              <p style={{ color: 'var(--muted)' }} className="mb-6">We pick you up from your hotel or you can meet us directly at the basecamp.</p>
              <ul className="space-y-3 list-none p-0 m-0">
                {pickups.map((pickup) => (
                  <li
                    key={pickup.id}
                    onClick={() => setActivePickup(pickup.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border border-solid cursor-pointer transition-colors ${activePickup === pickup.id ? 'bg-[#0093DD]/10 border-[#0093DD]' : 'bg-white border-transparent hover:border-[#e2e8ee]'}`}
                    style={{ borderColor: activePickup === pickup.id ? '#0093DD' : 'var(--line)' }}
                  >
                    <MapPin size={16} style={{ color: 'var(--sky)', flexShrink: 0 }} />
                    <span className="text-sm">{pickup.label}</span>
                    {pickup.fee > 0 && (
                      <span className="ml-auto text-xs font-bold whitespace-nowrap" style={{ color: 'var(--brand-dark)' }}>{formatIDR(pickup.fee)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden md:block data-reveal">
              <img src={photoUrl('34997046', 900)} alt="Canyoning guide at a waterfall" className="w-full h-72 object-cover rounded-xl shadow" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="reviews-h2">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 data-reveal">
            <div className="kicker"><span className="icon">⭐</span>Guest reviews</div>
            <h2>What our guests say</h2>
            <p className="lead mx-auto">Real reviews from travellers who explored the canyons with us.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <article key={review.id} className="bg-white rounded-2xl border border-solid p-6 shadow-sm" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ background: review.color || '#0093DD' }}>
                    {review.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{review.name}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{review.country} · {review.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-3" aria-label={`${review.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={13} fill={star <= review.rating ? '#fbbf24' : 'none'} color={star <= review.rating ? '#fbbf24' : '#cbd5e1'} />
                  ))}
                  <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>{review.source}</span>
                </div>
                <p className="text-sm italic" style={{ color: 'var(--muted)' }}>“{review.quote}”</p>
                <div className="mt-4 text-xs font-bold" style={{ color: 'var(--brand-dark)' }}>{review.tour}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-[#f7f9fa] border-y border-solid" style={{ borderColor: 'var(--line)' }} aria-labelledby="guides-h2">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 data-reveal">
            <div className="kicker"><span className="icon">👥</span>Meet the team</div>
            <h2>Your local guides</h2>
            <p className="lead mx-auto">Experienced, certified, and born in Bali. Safety is our top priority.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <article key={guide.id} className="bg-white rounded-2xl border border-solid p-6 shadow-sm" style={{ borderColor: 'var(--line)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 mx-auto text-white" style={{ background: guide.color || '#0093DD' }}>
                  {guide.initials}
                </div>
                <h3 className="text-lg font-bold text-center mb-1">{guide.name}</h3>
                <p className="text-xs font-bold text-center text-[#0093DD] mb-3">{guide.role}</p>
                <p className="text-xs text-center mb-4" style={{ color: 'var(--muted)' }}>{guide.years} experience · {guide.languages}</p>
                <p className="text-sm text-center mb-5" style={{ color: 'var(--muted)' }}>{guide.bio}</p>
                <Link to="/about" className="block btn-ghost text-center text-xs no-underline">Read profile</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="gallery-h2">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 data-reveal">
            <div className="kicker"><span className="icon">📸</span>Gallery</div>
            <h2>Canyon moments</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.slice(0, 6).map((image) => (
              <div key={image.id} className="relative h-48 rounded-xl overflow-hidden shadow-sm group">
                <img src={photoUrl(image.id, 600)} alt={image.alt || image.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/0 transition-colors flex items-end p-3">
                  <span className="text-sm font-bold text-white">{image.caption}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/gallery" className="btn-ghost no-underline">View full gallery</Link>
          </div>
        </div>
      </section>

      <section className="section bg-[#f7f9fa] border-y border-solid" style={{ borderColor: 'var(--line)' }} aria-labelledby="faq-h2">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 data-reveal">
            <div className="kicker"><span className="icon">❓</span>Frequently asked</div>
            <h2>Frequently asked questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((item) => (
              <details key={item.id} className="group bg-white rounded-xl border border-solid p-4" style={{ borderColor: 'var(--line)' }}>
                <summary className="flex justify-between items-center cursor-pointer list-none font-bold text-sm" style={{ color: 'var(--brand-dark)' }}>
                  {item.q}
                  <span className="w-5 h-5 rounded-full border border-solid grid place-items-center transition-transform group-open:rotate-45 shrink-0 ml-3" style={{ borderColor: 'var(--line)' }} aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="cta-h2">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center data-reveal">
            <h2 id="cta-h2" className="text-3xl font-bold mb-4">Ready to explore the canyons?</h2>
            <p className="mb-8" style={{ color: 'var(--muted)' }}>Choose your canyon, pick your date and send a booking request. We will confirm by WhatsApp.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/packages" className="btn-primary no-underline">Browse packages <ArrowRight size={18} /></Link>
              <button type="button" onClick={openQuiz} className="btn-ghost inline-flex items-center gap-2">
                <Clock size={16} /> Take the 30-second quiz
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}