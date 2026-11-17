import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useApp, useSite } from '../context/AppContext';

export default function Contact() {
  const site = useSite();
  const { content } = useApp();
  const whatsapp = site.whatsapp || `https://wa.me/${site.phoneHref}`;

  const onSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const message = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`;
    window.open(`${whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  };

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="breadcrumb" style={{ color: 'var(--text-on-dark)' }}>
            <Link to="/" style={{ color: '#9BDCFF' }}>Home</Link><span>/</span><span>Contact</span>
          </div>
          <span className="kicker">Contact us</span>
          <h1>Talk to a real guide.</h1>
          <p>Questions about water levels, private groups, pickup or which canyon fits your family? We usually reply within 15 minutes during opening hours.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp us <Icon name="wa" /></a>
            <a className="btn btn-outline" href={`mailto:${site.email}`}>Send an email <Icon name="mail" /></a>
          </div>
        </div>
      </section>

      <section className="page-section contact-section">
        <div className="wrap contact-grid">
          <div className="contact-copy" data-reveal>
            <span className="kicker">Reach the basecamp</span>
            <h2>We are one message away.</h2>
            <p className="lead">Message us with your date, group size and the canyon you have in mind. A local guide — not a call centre — will answer.</p>
            <div className="contact-list">
              <div className="contact-item">
                <span className="contact-icon"><Icon name="wa" /></span>
                <div><small>WhatsApp</small><a href={whatsapp} target="_blank" rel="noopener noreferrer">{site.phone}</a></div>
              </div>
              <div className="contact-item">
                <span className="contact-icon"><Icon name="mail" /></span>
                <div><small>Email</small><a href={`mailto:${site.email}`}>{site.email}</a></div>
              </div>
              <div className="contact-item">
                <span className="contact-icon"><Icon name="pin" /></span>
                <div><small>Basecamp</small><b>{site.address}</b></div>
              </div>
              <div className="contact-item">
                <span className="contact-icon"><Icon name="clock" /></span>
                <div><small>Opening hours</small><b>{site.hours}</b></div>
              </div>
            </div>

            {content.tours.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <small className="muted" style={{ display: 'block', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Popular questions</small>
                <div className="feature-chips">
                  {content.tours.slice(0, 4).map((tour) => (
                    <Link key={tour.id} to={`/packages/${tour.id}`}>{tour.name}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="contact-card" data-reveal>
            <h3>Send a quick message</h3>
            <p>Tell us your date, group size and what you would like to know. This form opens WhatsApp with your message ready to send.</p>
            <form className="contact-form" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="ctName">Your name <span className="req">*</span></label>
                <input id="ctName" name="name" type="text" autoComplete="name" placeholder="Full name" required />
              </div>
              <div className="field">
                <label htmlFor="ctEmail">Email <span className="req">*</span></label>
                <input id="ctEmail" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
              </div>
              <div className="field">
                <label htmlFor="ctMessage">Message <span className="req">*</span></label>
                <textarea id="ctMessage" name="message" placeholder="Hi, we are 2 adults looking at Egar Canyon around..." required />
              </div>
              <button className="btn btn-primary" type="submit">Send via WhatsApp <Icon name="wa" /></button>
            </form>
            <p className="form-note">
              Demo contact form — no message is stored on this website. Prefer email? Write to{' '}
              <a href={`mailto:${site.email}`} style={{ color: 'var(--brand-dark)', textDecoration: 'underline' }}>{site.email}</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}