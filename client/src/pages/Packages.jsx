import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Mountain, Users, Clock, Droplets } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIDR, tourImage } from '../lib/format';

const filters = [
  { id: 'all', label: 'All canyons' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
];

export default function Packages() {
  const { content, openBooking } = useApp();
  const [filter, setFilter] = useState('all');

  const tours = content.tours.filter((tour) => filter === 'all' || tour.levelKey === filter);

  return (
    <section className="section" aria-labelledby="packages-h2">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 data-reveal">
          <div className="kicker"><span className="icon">⛰️</span>Packages</div>
          <h2>Canyoning packages</h2>
          <p className="lead mx-auto">Select your adventure level. All prices are per person in IDR and include gear, guide, lunch and photos.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10 data-reveal">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold border border-solid transition-colors ${filter === item.id ? 'bg-[#0093DD] text-white border-[#0093DD]' : 'bg-white text-[#112e3c] hover:border-[#0093DD]'}`}
              style={{ borderColor: filter === item.id ? '#0093DD' : 'var(--line)' }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tours.length === 0 ? (
          <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>No canyons in this category.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tours.map((tour) => (
              <article key={tour.id} className="bg-white rounded-2xl border border-solid overflow-hidden shadow-sm flex flex-col" style={{ borderColor: 'var(--line)' }}>
                <Link to={`/packages/${tour.id}`} className="relative h-60 overflow-hidden block no-underline">
                  <img src={tourImage(tour, 1200)} alt={tour.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <span className="absolute top-4 left-4 badge light" style={{ background: 'rgba(255,255,255,.92)', color: '#0f6b9e' }}>{tour.badge || tour.level}</span>
                  <span className="absolute bottom-4 left-4 badge light" style={{ background: 'rgba(255,255,255,.92)', color: '#0f6b9e' }}>{formatIDR(tour.price)} / person</span>
                </Link>
                <div className="p-6 flex flex-col flex-1">
                  <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--brand-dark)' }}>{tour.name}</h2>
                  <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>{tour.short}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-xs">
                    {[
                      [Clock, 'Duration', tour.duration],
                      [Users, 'Group', tour.group],
                      [Mountain, 'Min age', `${tour.minAge}+`],
                      [Droplets, 'Swimming', tour.swim],
                    ].map(([Icon, label, value]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <span className="font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                          <Icon size={12} /> {label}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--brand-dark)' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{tour.bestFor}</p>

                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Includes</h3>
                  <ul className="flex flex-wrap gap-2 mb-6 list-none p-0 m-0">
                    {tour.inclusions.slice(0, 5).map((item) => (
                      <li key={item} className="px-3 py-1.5 rounded bg-[#eef6fb] text-[#0f6b9e] text-xs font-bold flex items-center gap-1">
                        <Check size={11} /> {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex gap-2">
                    <Link to={`/packages/${tour.id}`} className="btn-ghost flex-1 text-center no-underline text-sm">View details</Link>
                    <button type="button" onClick={() => openBooking(tour.id)} className="btn-primary flex-1 text-sm">
                      Book <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}