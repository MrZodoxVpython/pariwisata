import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIDR, tourImage } from '../lib/format';

export default function Hero() {
  const { content, openBooking } = useApp();
  const [index, setIndex] = useState(0);

  const tours = content.tours.slice(0, 3);
  const slides = tours.length
    ? tours.map((tour) => ({
        id: tour.id,
        image: tourImage(tour, 1600),
        kicker: tour.badge || tour.level,
        title: `${tour.name} — ${tour.short}`,
        text: tour.long,
        price: formatIDR(tour.price),
        cta: `Book ${tour.name}`,
      }))
    : [
        {
          id: '',
          image: 'https://images.pexels.com/photos/34997124/pexels-photo-34997124.jpeg?auto=compress&cs=tinysrgb&w=1600',
          kicker: 'Signature tour',
          title: 'Canyoning Bali — waterfalls, slides and hidden canyons',
          text: 'Rappel waterfalls, slide through jungle pools and explore hidden canyons with local guides.',
          price: 'IDR 1,750,000',
          cta: 'Browse packages',
        },
      ];

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[Math.min(index, slides.length - 1)];
  const nextImage = slides[(index + 1) % slides.length]?.image || slide.image;

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '70vh' }}>
      <img
        src={slide.image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ background: 'linear-gradient(90deg, rgba(6,30,43,.86) 0%, rgba(6,30,43,.55) 55%, rgba(6,30,43,.25) 100%)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 container mx-auto px-4 pt-20 pb-20 md:pt-28 md:pb-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-white mb-5 animate-fade-in">
            {slide.kicker}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6 animate-slide-up">
            {slide.title}
          </h1>
          <p className="text-white/90 text-base md:text-lg max-w-lg mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {slide.text}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {slide.id ? (
              <button type="button" onClick={() => openBooking(slide.id)} className="btn-primary">
                {slide.cta} <ArrowRight size={18} />
              </button>
            ) : (
              <Link to="/packages" className="btn-primary">
                {slide.cta} <ArrowRight size={18} />
              </Link>
            )}
            <Link
              to="/packages"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] text-sm font-extrabold no-underline text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              Compare canyons
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/75 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <span>From {slide.price}</span>
            <span aria-hidden="true">·</span>
            <span>Max 8 guests</span>
            <span aria-hidden="true">·</span>
            <span>Daily departures</span>
            <span aria-hidden="true">·</span>
            <span>Hotel pickup available</span>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-3" role="tablist" aria-label="Featured canyons">
          {slides.map((item, slideIndex) => (
            <button
              key={item.id || slideIndex}
              type="button"
              onClick={() => setIndex(slideIndex)}
              className={`h-2.5 rounded-full transition-all ${slideIndex === index ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/70 w-2.5'}`}
              aria-label={`Show ${item.kicker}`}
              aria-selected={slideIndex === index}
              role="tab"
            />
          ))}
        </div>
      )}

      {slides.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((current) => (current + 1) % slides.length)}
          className="absolute right-6 bottom-8 z-10 p-3 bg-white/10 backdrop-blur border border-white/25 rounded-full text-white hover:bg-white/20 transition-colors hidden sm:grid"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      )}

      <img src={nextImage} alt="" aria-hidden="true" className="hidden" loading="lazy" />
    </section>
  );
}