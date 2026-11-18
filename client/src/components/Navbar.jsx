import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp, useSite } from '../context/AppContext';
import Icon from './Icon';

const navLinks = [
  { section: 'top', label: 'Home' },
  { section: 'adventures', label: 'Canyoning Tour' },
  { section: 'about', label: 'About Us' },
  { section: 'faq', label: "FAQ's" },
  { section: 'contact', label: 'Contact Us' },
  { section: 'articles', label: 'Articles' },
];

const LOGO = 'https://i.ibb.co.com/7tT2vxbG/CANYONING-BALI-Photoroom.png';

export default function Navbar() {
  const site = useSite();
  const { currency, setCurrency, openBooking, language, toggleLanguage } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('cb-theme') || 'light';
    } catch (err) {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('cb-theme', theme);
    } catch (err) {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const header = document.getElementById('siteHeader');
    if (!header) return undefined;
    const onScroll = () => {
      const hero = document.getElementById('top');
      const limit = hero ? hero.getBoundingClientRect().bottom - header.offsetHeight : 8;
      header.classList.toggle('scrolled', window.scrollY >= limit);
      document.body.classList.toggle('topbar-hidden', window.scrollY > 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [location.pathname]);

  const goToSection = (section) => (event) => {
    if (location.pathname !== '/') {
      event.preventDefault();
      navigate(`/#${section}`);
    }
  };

  const whatsappHref = site.whatsapp || `https://wa.me/${site.phoneHref}`;

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="topbar">
        <div className="wrap topbar-inner">
          <span className="topbar-note"><span className="pulse" /> Canyoning in North Bali · Guides since 2016</span>
          <div className="topbar-right">
            <a href="#reviews" onClick={goToSection('reviews')} className="topbar-rating" aria-label="4.9 out of 5 from 312 reviews">
              <span className="stars" aria-hidden="true">★★★★★</span> <strong>4.9</strong> <span>(312 reviews)</span>
            </a>
            <div className="currency-wrap">
              <label htmlFor="currencySelect">Currency</label>
              <select
                id="currencySelect"
                className="currency-select"
                aria-label="Display currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
            <button
              type="button"
              className="lang-toggle"
              onClick={toggleLanguage}
              aria-label={language === 'id' ? 'Switch to English' : 'Switch to Indonesian'}
              title={language === 'id' ? 'Switch to English' : 'Switch to Indonesian'}
            >
              <span className={language === 'en' ? 'active' : undefined} data-no-translate>EN</span>
              <span className="lang-sep" aria-hidden="true" data-no-translate>/</span>
              <span className={language === 'id' ? 'active' : undefined} data-no-translate>ID</span>
            </button>
            <a className="topbar-link" href={whatsappHref} target="_blank" rel="noopener noreferrer">
              WhatsApp us <Icon name="arrow" />
            </a>
          </div>
        </div>
      </div>

      <header className="site-header" id="siteHeader">
        <div className="wrap nav">
          <Link className="brand" to="/" aria-label="Canyoning Bali home">
            <img className="brand-logo" src={LOGO} alt="Canyoning Bali logo" width="1417" height="1417" decoding="async" />
          </Link>
          <nav className="navlinks" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a key={link.section} href={`#${link.section}`} onClick={goToSection(link.section)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <button className="btn btn-primary header-book" type="button" onClick={() => openBooking()}>
              <span className="hide-mobile">Check availability</span><span className="show-mobile">Book</span> <Icon name="arrow" />
            </button>
            <button
              className="theme-toggle"
              id="themeToggle"
              type="button"
              aria-label="Toggle dark mode"
              aria-pressed={theme === 'dark'}
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <span className="theme-icon theme-icon-moon"><Icon name="moon" /></span>
              <span className="theme-icon theme-icon-sun"><Icon name="sun" /></span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}