import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Phone } from 'lucide-react';
import { useApp, useSite } from '../context/AppContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/packages', label: 'Packages' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/articles', label: 'Articles' },
  { to: '/contact', label: 'Contact' },
];

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#0093DD" />
      <path d="M10 42c8-13 13-13 22 0s14 13 22 0" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <path d="M18 27c5-8 9-8 14 0s9 8 14 0" stroke="white" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const site = useSite();
  const { content } = useApp();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem('cb-theme') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cb-theme', next);
  };

  const isDark = theme === 'dark';

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="fixed top-0 left-0 right-0 z-[55]">
        <div
          className={`backdrop-blur-md border-b border-solid ${
            isDark ? 'border-[#1f2a33] bg-[#0b161e]/85' : 'border-[#e2e8ee] bg-white/85'
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16 gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold tracking-tighter no-underline shrink-0"
                style={{ color: isDark ? '#e2e8ee' : '#0b2a3a' }}
              >
                <Logo />
                <span>{site.name}</span>
              </Link>

              <nav className="hidden md:flex items-center gap-7 text-sm font-bold" aria-label="Main navigation">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `no-underline transition-colors ${isActive ? 'text-[#0093DD]' : ''} ${
                        isDark ? 'hover:text-[#3bb4f7]' : 'hover:text-[#0093DD]'
                      }`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? '#0093DD' : isDark ? '#e2e8ee' : '#112e3c',
                    })}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  className={`p-2 rounded-full transition-colors ${isDark ? 'bg-[#162530] text-[#e2e8ee]' : 'text-[#112e3c] hover:bg-[#f7f9fa]'}`}
                >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <a
                  href={`tel:+${site.phoneHref}`}
                  className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-[#0093DD] text-white text-xs font-bold rounded-full hover:brightness-105 transition-colors no-underline"
                >
                  <Phone size={16} /> {site.phone}
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="md:hidden p-2"
                  style={{ color: isDark ? '#e2e8ee' : '#112e3c' }}
                  aria-label="Open menu"
                >
                  <Menu size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`fixed inset-0 z-[60] backdrop-blur-md flex flex-col transition-transform duration-300 ease-in-out ${
            open ? 'translate-y-0' : '-translate-y-full'
          }`}
          style={{ background: isDark ? '#0b161e' : 'rgba(11, 42, 58, 0.97)' }}
          aria-hidden={!open}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <span className="text-white font-extrabold text-lg tracking-tighter">{site.name}</span>
            <button type="button" onClick={() => setOpen(false)} className="p-2 text-white" aria-label="Close menu">
              <X size={22} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-8 space-y-4 px-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-white/90 text-lg font-bold hover:text-[#3bb4f7] transition-colors rounded-lg hover:bg-white/5 no-underline"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-4 py-3 text-white/90 hover:text-[#3bb4f7] transition-colors rounded-lg"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
              </button>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-white/90 font-bold hover:text-[#3bb4f7] transition-colors rounded-lg no-underline"
              >
                <Phone size={18} /> WhatsApp kami
              </a>
            </div>
            {content.tours.length > 0 && (
              <p className="px-4 text-xs text-white/50">
                {content.tours.length} canyons · max 8 guests · daily departures
              </p>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}