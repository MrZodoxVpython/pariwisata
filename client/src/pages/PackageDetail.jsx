import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Clock,
  Users,
  Mountain,
  Droplets,
  MapPin,
  ShieldCheck,
  Backpack,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIDR, tourImage } from '../lib/format';

export default function PackageDetail() {
  const { id } = useParams();
  const { content, openBooking } = useApp();
  const tour = content.tours.find((item) => item.id === id);

  if (!tour) {
    return (
      <section className="section">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-3">Canyon not found</h1>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>This canyon does not exist or is no longer available.</p>
          <Link to="/packages" className="btn-primary no-underline">Back to packages</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden">
        <img src={tourImage(tour, 1600)} alt={tour.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(6,30,43,.9), rgba(6,30,43,.45))' }} />
        <div className="relative z-10 container mx-auto px-4 py-20 md:py-28">
          <Link to="/packages" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-bold no-underline mb-6">
            <ArrowLeft size={16} /> All canyons
          </Link>
          <div className="max-w-2xl">
            <div className="inline-flex badge mb-4" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>{tour.badge || tour.level}</div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">{tour.name}</h1>
            <p className="text-white/85 text-base md:text-lg mb-6">{tour.short}</p>
            <div className="flex flex-wrap gap-4 text-white/80 text-sm">
              <span className="inline-flex items-center gap-1"><Clock size={14} /> {tour.duration}</span>
              <span className="inline-flex items-center gap-1"><Users size={14} /> {tour.group}</span>
              <span className="inline-flex items-center gap-1"><Mountain size={14} /> Age {tour.minAge}+</span>
              <span className="inline-flex items-center gap-1"><Droplets size={14} /> Swim {tour.swim}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <div className="data-reveal">
                <h2 className="text-2xl font-bold mb-3">The experience</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{tour.long}</p>
                <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--muted)' }}><strong>Best for:</strong> {tour.bestFor}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 data-reveal">
                {[
                  ['Jumps', tour.jumps],
                  ['Slides', tour.slides],
                  ['Max weight', `${tour.maxWeight} kg`],
                  ['Meeting', tour.meeting],
                ].map(([label, value]) => (
                  <div key={label} className="p-4 rounded-xl border border-solid" style={{ borderColor: 'var(--line)', background: 'var(--cream)' }}>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
                    <div className="text-sm font-bold" style={{ color: 'var(--brand-dark)' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="data-reveal">
                <h2 className="text-2xl font-bold mb-5">Itinerary</h2>
                <ol className="list-none p-0 m-0 space-y-4">
                  {tour.itinerary.map((step) => (
                    <li key={`${step.time}-${step.title}`} className="flex gap-4">
                      <div className="w-16 shrink-0 text-xs font-extrabold pt-1" style={{ color: 'var(--sky)' }}>{step.time}</div>
                      <div className="border-l border-solid pl-4 pb-1" style={{ borderColor: 'var(--line)' }}>
                        <div className="text-sm font-bold" style={{ color: 'var(--brand-dark)' }}>{step.title}</div>
                        <p className="text-sm m-0" style={{ color: 'var(--muted)' }}>{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 data-reveal">
                <div>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Check size={18} color="#0093DD" /> What is included</h2>
                  <ul className="list-none p-0 m-0 space-y-2">
                    {tour.inclusions.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                        <Check size={14} color="#0093DD" className="mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><X size={18} color="#b42318" /> Not included</h2>
                  <ul className="list-none p-0 m-0 space-y-2">
                    {tour.exclusions.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                        <X size={14} color="#b42318" className="mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 data-reveal">
                <div>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} color="#0093DD" /> Requirements</h2>
                  <ul className="space-y-2 pl-4 m-0">
                    {tour.requirements.map((item) => (
                      <li key={item} className="text-sm" style={{ color: 'var(--muted)' }}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Backpack size={18} color="#0093DD" /> What to bring</h2>
                  <ul className="space-y-2 pl-4 m-0">
                    {tour.bring.map((item) => (
                      <li key={item} className="text-sm" style={{ color: 'var(--muted)' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-solid data-reveal" style={{ borderColor: 'var(--line)', background: 'var(--cream)' }}>
                <h2 className="text-base font-bold mb-2 flex items-center gap-2"><MapPin size={17} color="#0093DD" /> Meeting point</h2>
                <p className="text-sm m-0 mb-3" style={{ color: 'var(--muted)' }}>{tour.meeting}</p>
                <h3 className="text-base font-bold mb-2">Cancellation policy</h3>
                <p className="text-sm m-0" style={{ color: 'var(--muted)' }}>{tour.cancellation}</p>
              </div>
            </div>

            <aside className="lg:col-span-1">
              <div className="rounded-2xl border border-solid p-6 shadow-sm lg:sticky lg:top-24" style={{ borderColor: 'var(--line)', background: '#fff' }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>From</div>
                <div className="text-3xl font-extrabold mb-1" style={{ color: 'var(--brand-dark)' }}>{formatIDR(tour.price)}</div>
                <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>per person · includes gear, guide, lunch &amp; photos</p>
                <button type="button" onClick={() => openBooking(tour.id)} className="w-full btn-primary">
                  Request this canyon <ArrowRight size={16} />
                </button>
                <ul className="mt-5 space-y-2 list-none p-0 text-xs" style={{ color: 'var(--muted)' }}>
                  <li className="flex gap-2"><Check size={13} color="#0093DD" className="shrink-0 mt-0.5" /> Free cancellation up to 48h</li>
                  <li className="flex gap-2"><Check size={13} color="#0093DD" className="shrink-0 mt-0.5" /> Pay after availability is confirmed</li>
                  <li className="flex gap-2"><Check size={13} color="#0093DD" className="shrink-0 mt-0.5" /> Confirmation via WhatsApp</li>
                </ul>
                <div className="mt-5 pt-4 border-t border-solid text-xs" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                  Questions? <Link to="/contact" className="font-bold text-[#0093DD] no-underline">Contact our team</Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}