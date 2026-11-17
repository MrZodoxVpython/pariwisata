import { Link } from 'react-router-dom';
import { Clock, Users, ShieldCheck, Droplets, Phone, Mail, MapPin } from 'lucide-react';
import { useApp, useSite } from '../context/AppContext';
import { photoUrl } from '../lib/format';

export default function About() {
  const { content } = useApp();
  const site = useSite();

  return (
    <section className="section" aria-labelledby="about-h2">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 data-reveal">
          <div className="kicker"><span className="icon">👋</span>About us</div>
          <h2 id="about-h2">Local guides, real canyons</h2>
          <p className="lead mx-auto">Canyoning Bali is run by a team of local guides born and raised in North Bali. We know every line, every pool and every seasonal change in our canyons.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
          <div className="space-y-5 data-reveal">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              We started Canyoning Bali to share the hidden canyons of North Bali with travellers who want a real adventure, safely. Every trip is led by certified local guides who prioritise safety, fun and respect for nature.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              We keep groups small (max 8 guests), provide full technical gear, and include lunch and edited photos on every tour. Hotel pickup is available from Ubud and other areas for a small surcharge.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[
                [Clock, 'Daily departures', '06:00 – 17:00'],
                [Users, 'Max group size', '8 guests'],
                [ShieldCheck, 'Certified guides', 'Local & trained'],
                [Droplets, 'Safety first', 'Briefing + gear'],
              ].map(([Icon, label, value]) => (
                <div key={label} className="p-4 rounded-xl border border-solid" style={{ borderColor: 'var(--line)', background: '#fff' }}>
                  <Icon size={20} color="#0093DD" className="mb-2" />
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--brand-dark)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="data-reveal">
            <img src={photoUrl('34997124', 900)} alt="Canyoning group in North Bali" className="w-full h-80 object-cover rounded-2xl shadow" loading="lazy" />
          </div>
        </div>

        <div className="text-center mb-10 data-reveal">
          <div className="kicker"><span className="icon">👥</span>Meet the team</div>
          <h2>Our guides</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.guides.map((guide) => (
            <article key={guide.id} className="bg-white rounded-2xl border border-solid p-6 shadow-sm" style={{ borderColor: 'var(--line)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 mx-auto text-white" style={{ background: guide.color || '#0093DD' }}>
                {guide.initials}
              </div>
              <h3 className="text-lg font-bold text-center mb-1">{guide.name}</h3>
              <p className="text-xs font-bold text-center text-[#0093DD] mb-3">{guide.role}</p>
              <p className="text-xs text-center mb-4" style={{ color: 'var(--muted)' }}>{guide.years} experience · {guide.languages}</p>
              <p className="text-sm text-center mb-5" style={{ color: 'var(--muted)' }}>{guide.bio}</p>
              <Link to="/contact" className="block btn-ghost text-center text-xs no-underline">Contact {guide.name.split(' ')[0]}</Link>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-2xl p-8 md:p-12 border border-solid data-reveal" style={{ borderColor: 'var(--line)', background: 'var(--cream)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-3">Get in touch</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Have questions about a tour, pickup or booking? Send us a message on WhatsApp or email.</p>
              <ul className="space-y-4 text-sm list-none p-0 m-0">
                <li className="flex items-start gap-3">
                  <Phone size={16} color="#0093DD" className="shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">WhatsApp / Phone</div>
                    <a href={`tel:+${site.phoneHref}`} className="text-[#0093DD] font-bold hover:underline no-underline">{site.phone}</a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail size={16} color="#0093DD" className="shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Email</div>
                    <a href={`mailto:${site.email}`} className="text-[#0093DD] font-bold hover:underline no-underline">{site.email}</a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={16} color="#0093DD" className="shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Basecamp</div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>{site.address}</div>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <img src={photoUrl('34997046', 900)} alt="Canyoning guide at the basecamp waterfall" className="w-full h-64 object-cover rounded-xl shadow" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}