import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Send, ArrowRight } from 'lucide-react';
import { useApp, useSite } from '../context/AppContext';
import api from '../lib/api';

export default function Contact() {
  const site = useSite();
  const { content, notify } = useApp();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setLoading(true);
    setError('');

    try {
      await api.createContactMessage({
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        preferredDate: data.date,
        people: data.people ? Number(data.people) : null,
        tourId: data.tour,
        message: data.message,
      });
      notify('Message sent. We will reply via WhatsApp or email shortly.');
      form.reset();
    } catch (err) {
      setError(err.details?.[0]?.message || err.message || 'Could not send your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section" aria-labelledby="contact-h2">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 data-reveal">
          <div className="kicker"><span className="icon">✉️</span>Contact</div>
          <h2 id="contact-h2">Get in touch</h2>
          <p className="lead mx-auto">Questions about tours, pickup, or booking? Send us a message and we will reply via WhatsApp or email.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 data-reveal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field">
                <label htmlFor="contact-name">Full name <span className="req">*</span></label>
                <input id="contact-name" type="text" name="name" required placeholder="John Doe" autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="contact-email">Email address</label>
                <input id="contact-email" type="email" name="email" placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="contact-whatsapp">WhatsApp number <span className="req">*</span></label>
              <input id="contact-whatsapp" type="tel" name="whatsapp" required placeholder="+62 812 xxx xxxx" autoComplete="tel" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field">
                <label htmlFor="contact-date">Preferred date</label>
                <input id="contact-date" type="date" name="date" min={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="field">
                <label htmlFor="contact-people">Number of guests <span className="req">*</span></label>
                <input id="contact-people" type="number" name="people" required min="1" max="8" defaultValue="2" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="contact-tour">Which canyon are you interested in?</label>
              <select id="contact-tour" name="tour" defaultValue="">
                <option value="">Any / not decided</option>
                {content.tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>{tour.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="contact-message">Message / notes</label>
              <textarea id="contact-message" name="message" rows="4" placeholder="Any special requests or questions?" />
            </div>
            {error && (
              <p className="text-xs font-bold rounded-lg p-3" style={{ background: '#fef3f2', color: '#b42318' }} role="alert">{error}</p>
            )}
            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Sending…' : 'Send message'} <Send size={18} />
            </button>
            <p className="text-[11px] text-center m-0" style={{ color: 'var(--muted)' }}>
              By sending this form you agree to our <Link to="/privacy" className="text-[#0093DD] no-underline">privacy policy</Link>.
            </p>
          </form>

          <div className="space-y-6 data-reveal">
            <div className="rounded-2xl p-6 md:p-8 border border-solid" style={{ borderColor: 'var(--line)', background: 'var(--cream)' }}>
              <h3 className="text-lg font-bold mb-5">Quick contact</h3>
              <ul className="space-y-5 list-none p-0 m-0">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#0093DD]/10 text-[#0093DD] shrink-0"><Phone size={20} /></div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--brand-dark)' }}>WhatsApp / Phone</div>
                    <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="text-[#0093DD] font-bold hover:underline no-underline">{site.phone}</a>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Fastest response — chat us directly</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#0093DD]/10 text-[#0093DD] shrink-0"><Mail size={20} /></div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--brand-dark)' }}>Email</div>
                    <a href={`mailto:${site.email}`} className="text-[#0093DD] font-bold hover:underline no-underline">{site.email}</a>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>We reply within 24 hours</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#0093DD]/10 text-[#0093DD] shrink-0"><MapPin size={20} /></div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--brand-dark)' }}>Basecamp</div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{site.address}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#0093DD]/10 text-[#0093DD] shrink-0"><Clock size={20} /></div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--brand-dark)' }}>Hours</div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{site.hours}</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="text-center">
              <Link to="/packages" className="btn-ghost inline-flex items-center gap-2 no-underline">
                Browse packages <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}