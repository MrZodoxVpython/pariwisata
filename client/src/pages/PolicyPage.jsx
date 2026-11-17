import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const FALLBACK = {
  privacy: {
    title: 'Privacy policy',
    html: `
      <h3>What we collect</h3>
      <p>When you send a booking request, we collect your name, email address, WhatsApp number, preferred date, group size, pickup area and any notes you choose to share.</p>
      <h3>Why we collect it</h3>
      <p>We use your details to respond to your enquiry, confirm availability, arrange pickup, prepare safety information and manage your booking. We do not sell your personal data.</p>
      <h3>Your rights</h3>
      <p>You can ask us to access, correct or delete your personal data by emailing <strong>hello@canyoningbali.com</strong>.</p>`,
  },
  terms: {
    title: 'Terms & conditions',
    html: `
      <h3>Booking requests</h3>
      <p>A booking request is not a confirmed booking. We confirm availability by WhatsApp or email, then send payment and pickup details. Prices are in Indonesian rupiah (IDR); converted amounts on this website are approximate.</p>
      <h3>Safety &amp; suitability</h3>
      <p>Canyoning is an outdoor adventure activity with inherent risks. You must follow your guide's instructions, disclose relevant medical conditions and meet the age, fitness, swimming and weight requirements for your chosen canyon.</p>`,
  },
  cancellation: {
    title: 'Cancellation & weather policy',
    html: `
      <h3>Free cancellation</h3>
      <p>Cancel free of charge up to 48 hours before your scheduled departure. We will refund any deposit paid or help you move your date.</p>
      <h3>Within 48 hours</h3>
      <p>Cancellations made 24–48 hours before departure may incur a 50% charge. Cancellations within 24 hours and no-shows are charged in full.</p>
      <h3>Weather &amp; water levels</h3>
      <p>If we decide that conditions are unsafe, you can reschedule to another date or receive a full refund.</p>`,
  },
};

export default function PolicyPage({ type }) {
  const { content, openPolicy } = useApp();
  const policy = content.policies?.[type] || FALLBACK[type];

  return (
    <>
      <section className="page-hero">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div className="breadcrumb" style={{ color: 'var(--text-on-dark)' }}>
            <Link to="/" style={{ color: '#9BDCFF' }}>Home</Link><span>/</span><span>{policy?.title || 'Policy'}</span>
          </div>
          <span className="kicker">Policies</span>
          <h1>{policy?.title || 'Policy'}</h1>
          <p>Clear, honest terms so you know exactly where you stand before your canyoning day.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap" style={{ maxWidth: 900 }}>
          {policy ? (
            <div className="prose-site" dangerouslySetInnerHTML={{ __html: policy.html }} />
          ) : (
            <div className="not-found" style={{ minHeight: '30vh' }}>
              <div>
                <h2 style={{ fontSize: 28 }}>This policy is not available yet</h2>
                <p className="muted" style={{ marginBottom: 18 }}>Message us and we will send the details straight away.</p>
                <button className="btn btn-primary" type="button" onClick={() => openPolicy('privacy')}>Read the privacy policy</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 36, paddingTop: 26, borderTop: '1px solid var(--line)' }}>
            <Link className="btn btn-ghost" to="/privacy">Privacy policy</Link>
            <Link className="btn btn-ghost" to="/terms">Terms &amp; conditions</Link>
            <Link className="btn btn-ghost" to="/cancellation">Cancellation policy</Link>
            <Link className="btn btn-primary" to="/contact">Still have questions?</Link>
          </div>
        </div>
      </section>
    </>
  );
}