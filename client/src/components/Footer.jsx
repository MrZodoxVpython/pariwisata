import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp, useSite } from '../context/AppContext';
import Icon from './Icon';

const LOGO = 'https://canyoningbali.id/wp-content/uploads/2019/03/CANYONING-BALI.png';

export default function Footer() {
  const site = useSite();
  const { openPolicy } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const whatsappHref = site.whatsapp || `https://wa.me/${site.phoneHref}`;

  const goToSection = (section) => (event) => {
    if (location.pathname !== '/') {
      event.preventDefault();
      navigate(`/#${section}`);
    }
  };

  const policyLink = (key) => (event) => {
    event.preventDefault();
    openPolicy(key);
  };

  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand" to="/" aria-label="Canyoning Bali home">
              <img className="brand-logo" src={LOGO} alt="Canyoning Bali logo" width="1417" height="1417" loading="lazy" decoding="async" />
            </Link>
            <p>Canyoning adventures in North Bali. Local guides, real canyons and unforgettable days.</p>
            <div className="footer-rating"><span className="stars" aria-hidden="true">★★★★★</span><span>4.9/5 · 312 guest reviews</span></div>
            <div className="socials">
              <a href={site.instagram || 'https://www.instagram.com/'} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Icon name="instagram" /></a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><Icon name="wa" /></a>
              <a href="https://www.tripadvisor.com/" target="_blank" rel="noopener noreferrer" aria-label="TripAdvisor"><Icon name="star" /></a>
              <a href="https://www.google.com/maps/" target="_blank" rel="noopener noreferrer" aria-label="Google reviews"><Icon name="pin" /></a>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <div className="footer-links">
              <a href="#top" onClick={goToSection('top')}>Home</a>
              <a href="#adventures" onClick={goToSection('adventures')}>Canyoning tour</a>
              <a href="#about" onClick={goToSection('about')}>About us</a>
              <a href="#faq" onClick={goToSection('faq')}>FAQ's</a>
              <a href="#contact" onClick={goToSection('contact')}>Contact us</a>
              <a href="#articles" onClick={goToSection('articles')}>Articles</a>
            </div>
          </div>
          <div>
            <h4>Contact</h4>
            <div className="footer-contact">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer"><Icon name="wa" /><span>WhatsApp: <span>{site.phone}</span></span></a>
              <a href={`mailto:${site.email}`}><Icon name="mail" /><span>{site.email}</span></a>
              <a href={`tel:+${site.phoneHref}`}><Icon name="phone" /><span>{site.phone}</span></a>
              <a href="https://maps.google.com/?q=Pupuan+Tabanan+Bali" target="_blank" rel="noopener noreferrer"><Icon name="pin" /><span>{site.address}</span></a>
              <span><Icon name="clock" /><span>{site.hours}</span></span>
            </div>
          </div>
          <div>
            <h4>Good to know</h4>
            <div className="footer-links">
              <a href="#" onClick={policyLink('cancellation')}>Cancellation &amp; weather</a>
              <a href="#" onClick={policyLink('safety')}>Safety commitment</a>
              <a href="#" onClick={policyLink('privacy')}>Privacy policy</a>
              <a href="#" onClick={policyLink('terms')}>Terms &amp; conditions</a>
              <a href={`mailto:${site.email}`}>Ask a question</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© <span>{new Date().getFullYear()}</span> Canyoning Bali. All rights reserved.</span>
          <span className="footer-demo">Demo build · Sample content · Simulated payments</span>
          <span>Prices in IDR · Converted amounts are approximate</span>
        </div>
      </div>
    </footer>
  );
}