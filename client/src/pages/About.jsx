import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';

const FALLBACK_GUIDES = [
  { id: 'made', name: 'Made W.', role: 'Lead canyon guide', years: '10 years', bio: 'Born in Tabanan and happiest in the water. Made knows the seasonal lines and reads the canyon before every descent.', languages: 'English · Indonesian', initials: 'MW', color: '#0077B6' },
  { id: 'wayan', name: 'Wayan S.', role: 'Safety lead', years: '8 years', bio: 'Wayan leads equipment checks, first-aid readiness and water-level decisions. Calm, precise and always one step ahead.', languages: 'English · Indonesian', initials: 'WS', color: '#0093DD' },
  { id: 'ketut', name: 'Ketut A.', role: 'Adventure guide & photographer', years: '6 years', bio: 'Ketut keeps the group moving and captures the day so you can stay present. Ask him for the best photo spot.', languages: 'English · Indonesian', initials: 'KA', color: '#8a6f3d' },
];

export default function About() {
  const { content, openPolicy } = useApp();
  const guides = content.guides.length ? content.guides : FALLBACK_GUIDES;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <span className="kicker">About Canyoning Bali</span>
          <h1>Real adventure.<br />Thoughtfully guided.</h1>
          <p>A great canyoning day is about more than the descent. It is about feeling prepared, supported and free to enjoy the wild world around you.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="/#adventures">Explore canyons <Icon name="arrow" /></a>
            <a className="btn btn-outline" href="/#contact">Talk to a guide</a>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap split">
          <div className="media-stack">
            <img className="media-main" src="/assets/tours/samba.webp" width="934" height="1400" alt="A canyoning guide rappelling down a tall jungle waterfall in Bali" loading="lazy" style={{ objectPosition: 'center 20%' }} />
            <img className="media-secondary" src="https://images.pexels.com/photos/4534200/pexels-photo-4534200.jpeg?auto=compress&cs=tinysrgb&w=800" width="800" height="600" alt="A canyoning guide rappelling beside a waterfall" loading="lazy" />
            <div className="stat-float"><span className="stars" aria-hidden="true">★★★★★</span><strong>4.9/5</strong><span>from 312 guest reviews</span></div>
          </div>
          <div className="why-copy">
            <span className="kicker">More than a tour</span>
            <h2>Local guides who know every route.</h2>
            <p className="lead">Canyoning Bali is a small team of local guides based in North Bali. We have been exploring these canyons since 2016 and we keep groups small — a maximum of eight guests — so every descent feels personal and safe.</p>
            <div className="benefits">
              <div className="benefit"><span className="benefit-icon"><Icon name="pin" /></span><div><b>Local knowledge</b><p>Guides who grew up around these canyons, know the water and read the conditions before every descent.</p></div></div>
              <div className="benefit"><span className="benefit-icon"><Icon name="shield" /></span><div><b>Guidance at every step</b><p>Clear briefing, patient instruction and a guide close by from the first rappel to the last slide.</p></div></div>
              <div className="benefit"><span className="benefit-icon"><Icon name="mountain" /></span><div><b>Adventure for your level</b><p>Beginner-friendly routes, optional jumps and more challenging canyons for confident adventurers.</p></div></div>
            </div>
            <div className="promise-row">
              <span><Icon name="check" /> Max 8 guests</span>
              <span><Icon name="check" /> 1:4 guide ratio</span>
              <span><Icon name="check" /> No hidden fees</span>
              <span><Icon name="check" /> Photos included</span>
            </div>
            <button className="btn btn-dark" type="button" onClick={() => openPolicy('safety')}>Our safety approach <Icon name="arrow" /></button>
          </div>
        </div>
      </section>

      <section className="page-section alt">
        <div className="wrap">
          <div className="section-head compact">
            <div><span className="kicker">The people behind the ropes</span><h2>Meet your guides.</h2></div>
            <p>Local knowledge, calm instruction and a genuine love for the canyon.</p>
          </div>
          <div className="guide-grid">
            {guides.map((guide) => (
              <article className="guide-card" key={guide.id || guide.name}>
                <span className="guide-avatar" style={{ background: guide.color }} aria-hidden="true">{guide.initials}</span>
                <div>
                  <b>{guide.name}</b>
                  <small>{guide.role} · {guide.years}</small>
                  <p>{guide.bio}</p>
                  <div className="guide-langs"><span>{guide.languages}</span></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap">
          <div className="section-head">
            <div><span className="kicker">Simple from start to finish</span><h2>Your adventure, in 3 steps.</h2></div>
            <p>Know what happens next before you book. No confusing process and no hidden steps.</p>
          </div>
          <div className="steps">
            <article className="step"><div className="step-no">01</div><h3>Choose your canyon</h3><p>Compare difficulty, duration and inclusions. Use our 30-second quiz if you are not sure which route fits.</p><small>2 minutes</small></article>
            <article className="step"><div className="step-no">02</div><h3>Check availability</h3><p>Send your date and group size. We reply within 15 minutes during business hours, 08:00–20:00 WITA.</p><small>15-minute reply</small></article>
            <article className="step"><div className="step-no">03</div><h3>Confirm &amp; go</h3><p>Review your trip, then secure it with a 25% deposit or pay in full. Card, bank transfer and QRIS are available in the demo checkout.</p><small>Demo payment gateway</small></article>
          </div>
        </div>
      </section>
    </>
  );
}