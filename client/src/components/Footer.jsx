import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Instagram, Facebook } from 'lucide-react';
import { useSite } from '../context/AppContext';

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.14h-.01c-1.5 0-2.98-.4-4.27-1.17l-.31-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.35c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.15 8.24z" />
    </svg>
  );
}

export default function Footer() {
  const site = useSite();

  return (
    <footer
      className="border-t border-solid"
      style={{
        borderColor: 'var(--line)',
        background: 'var(--cream)',
        color: 'var(--brand-ink)',
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect width="64" height="64" rx="16" fill="#0093DD" />
                <path d="M10 42c8-13 13-13 22 0s14 13 22 0" stroke="white" strokeWidth="5" strokeLinecap="round" />
                <path d="M18 27c5-8 9-8 14 0s9 8 14 0" stroke="white" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <span className="text-xl font-extrabold tracking-tighter">{site.name}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Guided canyoning tours in North Bali. Local guides, waterfalls, natural slides and
              hotel pickup. Beginner-friendly routes from IDR 1,750,000.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider mb-5">Quick links</h4>
            <ul className="space-y-3 text-sm list-none p-0 m-0">
              {[
                ['/', 'Home'],
                ['/packages', 'Packages'],
                ['/about', 'About'],
                ['/gallery', 'Gallery'],
                ['/articles', 'Articles'],
                ['/contact', 'Contact'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="transition-colors hover:text-[#0093DD] no-underline" style={{ color: 'var(--brand-ink)' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider mb-5">Contact</h4>
            <ul className="space-y-4 text-sm list-none p-0 m-0">
              <li className="flex items-start gap-3">
                <Phone size={16} style={{ color: 'var(--sky)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="font-bold">WhatsApp / Phone</div>
                  <a href={`tel:+${site.phoneHref}`} className="text-sm transition-colors no-underline" style={{ color: 'var(--sky)' }}>
                    {site.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} style={{ color: 'var(--sky)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="font-bold">Email</div>
                  <a href={`mailto:${site.email}`} className="text-sm transition-colors no-underline" style={{ color: 'var(--sky)' }}>
                    {site.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} style={{ color: 'var(--sky)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="font-bold">Basecamp</div>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>{site.address}</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} style={{ color: 'var(--sky)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="font-bold">Hours</div>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>{site.hours}</div>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider mb-5">Follow us</h4>
            <div className="flex gap-3">
              {[
                ['Instagram', Instagram, site.instagram],
                ['WhatsApp', WhatsAppIcon, site.whatsapp],
                ['Facebook', Facebook, site.facebook],
              ].map(([name, Icon, href]) => (
                <a
                  key={name}
                  href={href || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors no-underline"
                  style={{ background: 'var(--line)', color: 'var(--brand-ink)' }}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
            <p className="text-xs mt-5" style={{ color: 'var(--muted)' }}>
              Certified local guides · Safety-first canyoning since 2016
            </p>
          </div>
        </div>

        <div className="border-t border-solid pt-8" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p style={{ color: 'var(--muted)' }}>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs">
              <Link to="/privacy" className="transition-colors hover:text-[#0093DD] no-underline" style={{ color: 'var(--muted)' }}>
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-[#0093DD] no-underline" style={{ color: 'var(--muted)' }}>
                Terms
              </Link>
              <Link to="/cancellation" className="transition-colors hover:text-[#0093DD] no-underline" style={{ color: 'var(--muted)' }}>
                Cancellation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}