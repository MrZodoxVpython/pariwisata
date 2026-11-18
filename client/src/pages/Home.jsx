import { useEffect, useMemo, useState } from 'react';
import { useApp, useSite } from '../context/AppContext';
import Icon from '../components/Icon';
import {
  addDays,
  addMonthsISO,
  articleDate,
  articleExcerpt,
  articleImage,
  formatMoney,
  localISO,
  photoUrl,
  tourImage,
} from '../lib/format';

const HERO_SLIDES = [
  {
    src: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/26/74/d7/last-rappel-of-maboya.jpg?w=1200&h=-1&s=1',
    alt: 'A group canyoning through a dramatic rocky canyon with guides and ropes',
  },
  {
    src: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/21/8e/fc/ba/group-photo.jpg?w=1200&h=-1&s=1',
    alt: 'Waterfall cascading into a jungle pool',
  },
  {
    src: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/21/e9/c3/c5/suramindi-canyon.jpg?w=1200&h=-1&s=1',
    alt: 'Person rappelling down a waterfall with rope',
  },
  {
    src: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/28/20/07/95/caption.jpg?w=1100&h=-1&s=1',
    alt: 'Group hiking through narrow canyon gorge',
  },
];

const LEARN_CARDS = [
  { icon: 'leaf', title: 'What is canyoning', body: 'A canyon is a natural environment, and there are many ways to move through it: walking, rappelling (abseiling), jumping, swimming, scrambling and sliding.' },
  { icon: 'mountain', title: 'Canyoning level', body: 'We offer tours for every level, from beginner to advanced. No experience is required in beginner canyons — all we ask for is a reasonable level of fitness.' },
  { icon: 'users', title: 'Children', body: 'We are happy to take children as young as 8 years old into Egar Canyon. Children aged 12+ can join any beginner canyon, all season. As for a maximum age — you are only as old as you feel!' },
  { icon: 'camera', title: 'Free footage', body: 'Your safety always comes first, but when the moment is right we capture photos and video of your descent — and they are included. Bring your own storage to copy the files, and tag us in your stories: @canyoningbali.' },
  { icon: 'home', title: 'Round-trip transfer', body: 'Every trip includes round-trip transfer from your accommodation anywhere in Bali.' },
  { icon: 'calendar', title: 'Two people minimum', body: 'Canyoning trips run with a minimum of two people. Travelling solo? Book onto a trip that others are already on, or give us a call and we will help you check availability.' },
  { icon: 'shield', title: 'Professional guide', body: 'Canyoning is not our side job — it is our main focus. Our professional guides create a fun, safe environment in the canyon.' },
  { icon: 'lock', title: 'Equipment', body: 'We have hand-picked the best canyoning equipment in the world, so you can rest assured you will wear the most comfortable, well-adapted and safe gear on your tour.' },
  { icon: 'water', title: 'Swimming', body: 'Can’t swim? No worries — you can join any beginner canyon, where no swimming is required. Intermediate and advanced canyons do require you to be able to swim.' },
];

const FAQ_FALLBACK = [
  ['Do I need canyoning experience to join?', 'No. Egar and Maboya are beginner-friendly and include a full safety briefing. Samba and Aling are better suited to guests with some outdoor experience and comfortable swimming ability.'],
  ['Is canyoning safe?', 'Canyoning is an adventure activity with inherent risks. We use checked equipment, trained local guides, safety briefings and water-level checks. We adjust or cancel routes when conditions are unsafe. Tell us about relevant medical conditions before booking.'],
  ["Can I join if I cannot swim?", 'Egar and Maboya can be suitable for non-confident swimmers because swimming is optional on those routes. Samba and Aling require comfortable swimming ability. Please tell us honestly about your comfort in water when booking.'],
  ['What happens if it rains?', 'We monitor weather and water levels. If conditions are unsafe, we reschedule your trip or offer a full refund. Light rain alone does not always cancel a trip; your guide will make the final call.'],
  ['What is included in the price?', 'Prices include a local guide, canyoning equipment, safety briefing, lunch and drinking water. Most tours include edited photos and pickup from Ubud. Check each canyon for exact inclusions.'],
  ['Do you offer hotel pickup?', 'Yes. Pickup is available from Ubud and selected areas of South Bali. Pickup outside Ubud may carry a surcharge. Confirm your area when booking and we will send the exact pickup time.'],
  ['What should I bring and wear?', 'Bring swimwear, quick-dry clothes, water shoes or trainers, sunscreen, a towel and a change of clothes. We provide the canyoning harness, helmet and wetsuit.'],
  ['How do I confirm and pay?', 'Send a booking request with your date and group size. We confirm availability within 15 minutes during business hours. You can then secure the date with a 25% deposit or pay the full amount by card, bank transfer or QRIS. The checkout on this demo site simulates payment only. Prices are in IDR.'],
  ['What is your cancellation policy?', 'Free cancellation up to 48 hours before departure. Cancellations within 24–48 hours may incur a 50% charge. No-shows are charged in full. Weather cancellations are rescheduled or refunded. Read the full cancellation policy.'],
  ['Can I book a private group?', 'Yes. Private groups are available on all canyons, subject to availability. Contact us on WhatsApp with your preferred date and group size for a private quote.'],
];

const FALLBACK_GUIDES = [
  { id: 'made', name: 'Made W.', role: 'Lead canyon guide', years: '10 years', bio: 'Born in Tabanan and happiest in the water. Made knows the seasonal lines and reads the canyon before every descent.', languages: 'English · Indonesian', initials: 'MW', color: '#0077B6' },
  { id: 'wayan', name: 'Wayan S.', role: 'Safety lead', years: '8 years', bio: 'Wayan leads equipment checks, first-aid readiness and water-level decisions. Calm, precise and always one step ahead.', languages: 'English · Indonesian', initials: 'WS', color: '#0093DD' },
  { id: 'ketut', name: 'Ketut A.', role: 'Adventure guide & photographer', years: '6 years', bio: 'Ketut keeps the group moving and captures the day so you can stay present. Ask him for the best photo spot.', languages: 'English · Indonesian', initials: 'KA', color: '#8a6f3d' },
];

const FALLBACK_REVIEWS = [
  { id: 'r1', name: 'Sarah M.', country: 'Australia', date: '2 weeks ago', tour: 'Egar Canyon', rating: 5, source: 'Google', initials: 'SM', color: '#0077B6', quote: 'The Egar Canyon day was the highlight of our Bali trip. Our guide was calm, funny and incredibly safety-focused. The rappel felt challenging but totally doable.' },
  { id: 'r2', name: 'Jonas K.', country: 'Germany', date: '1 month ago', tour: 'Maboya Canyon', rating: 5, source: 'Google', initials: 'JK', color: '#0093DD', quote: 'We booked as a couple with zero canyoning experience. Everything was explained clearly, the gear was in great condition, and the natural slides were unreal.' },
  { id: 'r3', name: 'Emma R.', country: 'United Kingdom', date: '1 month ago', tour: 'Samba Canyon', rating: 5, source: 'TripAdvisor', initials: 'ER', color: '#8a6f3d', quote: 'Samba is not for the faint-hearted — exactly what we wanted. The team checked water levels carefully and the whole day felt professional.' },
  { id: 'r4', name: 'Liam O.', country: 'Ireland', date: '2 months ago', tour: 'Egar Canyon', rating: 5, source: 'Google', initials: 'LO', color: '#4d6b8a', quote: 'Pickup from Ubud was on time, lunch was delicious, and the photos are amazing. Worth every rupiah.' },
  { id: 'r5', name: 'Aiko T.', country: 'Japan', date: '2 months ago', tour: 'Maboya Canyon', rating: 5, source: 'Google', initials: 'AT', color: '#7a5a4a', quote: 'As a solo traveller I felt welcome immediately. Small group, great energy, and the canyon is stunning. I would book again in a heartbeat.' },
  { id: 'r6', name: 'Marco B.', country: 'Italy', date: '3 months ago', tour: 'Aling Canyon', rating: 5, source: 'TripAdvisor', initials: 'MB', color: '#006C9F', quote: 'Aling was a proper adventure. Big rappels, beautiful cave sections, and guides who clearly love what they do. Safety was never an afterthought.' },
];

const FALLBACK_GALLERY = [
  { id: '34997124', caption: 'Into the canyon', alt: 'A group canyoning through a rocky canyon with ropes and guides' },
  { id: '7163522', caption: 'Waterfall rappel', alt: 'A canyoning guide rappelling down a lush waterfall' },
  { id: '5741502', caption: 'Jungle pools', alt: 'A hidden waterfall and pool surrounded by dense jungle' },
  { id: '34997046', caption: 'Cave sections', alt: 'A canyoning guide descending a rope in a dramatic cave waterfall' },
  { id: '5272925', caption: 'Rope work', alt: 'A canyoning guide on a rope beside a waterfall' },
  { id: '4534200', caption: 'The descent', alt: 'A canyoning guide rappelling down a waterfall in a tropical canyon' },
];

const FALLBACK_ARTICLES = [
  {
    slug: 'first-canyon',
    kicker: 'Beginner guide',
    title: 'Your first canyoning day in Bali: what actually happens',
    meta: '12 November 2026 · 6 min read · By the Canyoning Bali team',
    imageId: '7163522',
    body: '',
  },
  {
    slug: 'choose-canyon',
    kicker: 'Canyon comparison',
    title: 'Egar, Maboya or Samba: how to choose your canyon',
    meta: '4 November 2026 · 8 min read · By the Canyoning Bali team',
    imageId: '5741502',
    body: '',
  },
  {
    slug: 'packing-list',
    kicker: 'Gear & prep',
    title: 'What to pack for canyoning (and what to leave behind)',
    meta: '28 October 2026 · 5 min read · By the Canyoning Bali team',
    imageId: '931007',
    body: '',
  },
];

function convertedPrice(price, currency) {
  return currency === 'IDR' ? 'Billed in IDR' : `≈ ${formatMoney(price, 'IDR')}`;
}

function Stars({ rating, label }) {
  return (
    <span className="stars" aria-label={label || `${rating} out of 5 stars`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function Home() {
  const { content, currency, openBooking, openQuiz, openPolicy, openArticle, openTourDetail, openLightbox } = useApp();
  const site = useSite();
  const [filter, setFilter] = useState('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [quickTour, setQuickTour] = useState('');
  const [quickDate, setQuickDate] = useState('');
  const [quickPeople, setQuickPeople] = useState('2');

  const tours = content.tours;
  const reviews = content.reviews.length ? content.reviews : FALLBACK_REVIEWS;
  const guides = content.guides.length ? content.guides : FALLBACK_GUIDES;
  const gallery = content.gallery.length ? content.gallery : FALLBACK_GALLERY;
  const articles = content.articles.length ? content.articles : FALLBACK_ARTICLES;
  const faqs = content.faqs.length
    ? content.faqs.map((item) => [item.q, item.a])
    : FAQ_FALLBACK;

  const filteredTours = useMemo(
    () => tours.filter((tour) => filter === 'all' || tour.levelKey === filter),
    [tours, filter]
  );

  useEffect(() => {
    setQuickTour((current) => current || tours[0]?.id || '');
  }, [tours]);

  useEffect(() => {
    const today = localISO();
    setQuickDate((current) => current || addDays(today, 1));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const onSubmitQuick = (event) => {
    event.preventDefault();
    openBooking(quickTour || tours[0]?.id || '', { date: quickDate, people: quickPeople });
  };

  const today = localISO();
  const maxDate = addMonthsISO(today, 12);

  const onSubmitContact = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const message = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`;
    const href = `https://wa.me/${site.phoneHref}?text=${encodeURIComponent(message)}`;
    window.open(href, '_blank', 'noopener');
  };

  return (
    <>
      {/* HERO */}
      <section className="hero" id="top" aria-labelledby="heroTitle">
        <div className="hero-media" aria-roledescription="slideshow">
          {HERO_SLIDES.map((slide, index) => (
            <img
              key={slide.src}
              className={`hero-slide${index === heroIndex ? ' current' : ''}`}
              src={slide.src}
              alt={slide.alt}
              fetchPriority={index === 0 ? 'high' : undefined}
              loading={index === 0 ? undefined : 'lazy'}
              decoding="async"
            />
          ))}
        </div>
        <div className="hero-shade" />
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">North Bali · Small groups · Local guides</span>
            <h1 id="heroTitle">Canyoning in Bali,<br />beyond the ordinary.</h1>
            <p>Rappel waterfalls, slide through jungle pools and explore hidden canyons with local guides who know every route. Beginner-friendly options, maximum 8 guests.</p>
            <div className="hero-actions">
              <button className="btn btn-primary" type="button" onClick={() => openBooking()}>Check availability <Icon name="arrow" /></button>
              <a className="btn btn-outline" href="#adventures">Explore canyons</a>
            </div>
            <div className="hero-proof">
              <span><Icon name="star" /> 4.9/5 · 312 reviews</span>
              <span><Icon name="check" /> Free cancellation 48h</span>
              <span><Icon name="users" /> Max 8 guests</span>
              <span><Icon name="pin" /> Hotel pickup</span>
            </div>
          </div>
          <aside className="hero-card" aria-label="Quick availability check">
            <div className="hero-card-head">
              <span className="kicker">Plan your day</span>
              <h2>Check availability</h2>
              <p>Deposit or pay in full. Demo checkout.</p>
            </div>
            <form className="quick-form" id="quickForm" onSubmit={onSubmitQuick}>
              <div className="field">
                <label htmlFor="quickTour">Canyon</label>
                <select id="quickTour" name="quickTour" value={quickTour} onChange={(event) => setQuickTour(event.target.value)}>
                  {tours.map((tour) => (
                    <option key={tour.id} value={tour.id}>{tour.name} — {tour.level}</option>
                  ))}
                </select>
              </div>
              <div className="quick-grid">
                <div className="field">
                  <label htmlFor="quickDate">Date</label>
                  <input id="quickDate" name="quickDate" type="date" required min={today} max={maxDate} value={quickDate} onChange={(event) => setQuickDate(event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="quickPeople">Guests</label>
                  <select id="quickPeople" name="quickPeople" value={quickPeople} onChange={(event) => setQuickPeople(event.target.value)}>
                    {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" type="submit">Check availability <Icon name="arrow" /></button>
              <div className="hero-card-foot">
                <span>From <strong data-money="1750000">{formatMoney(1750000, currency)}</strong> / person</span>
                <span className="mini-rating">★ 4.9</span>
              </div>
            </form>
          </aside>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="wrap trust-strip">
        <div className="trust-grid">
          <div className="trust-item"><span className="trust-icon"><Icon name="users" /></span><div><b>Local canyon guides</b><small>10+ years exploring North Bali</small></div></div>
          <div className="trust-item"><span className="trust-icon"><Icon name="shield" /></span><div><b>Safety comes first</b><small>Briefing, checked gear &amp; water checks</small></div></div>
          <div className="trust-item"><span className="trust-icon"><Icon name="water" /></span><div><b>Wild Bali nature</b><small>Waterfalls, slides &amp; hidden valleys</small></div></div>
          <div className="trust-item"><span className="trust-icon"><Icon name="camera" /></span><div><b>Photos included</b><small>Edited memories of your day</small></div></div>
        </div>
      </div>

      {/* ADVENTURES */}
      <section className="section" id="adventures">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div><span className="kicker">Choose your canyon</span><h2>Four canyons. One unforgettable day.</h2></div>
            <div className="head-side">
              <p>From your first rappel to a full-day technical descent, choose the route that matches your confidence and experience.</p>
              <button className="btn btn-ghost btn-sm" type="button" id="quizBtn" onClick={openQuiz}>Find my canyon <Icon name="arrow" /></button>
            </div>
          </div>
          <div className="filters" role="group" aria-label="Filter canyons by level" data-reveal>
            <button className={`chip${filter === 'all' ? ' active' : ''}`} type="button" onClick={() => setFilter('all')}>All canyons</button>
            <button className={`chip${filter === 'beginner' ? ' active' : ''}`} type="button" onClick={() => setFilter('beginner')}>Beginner</button>
            <button className={`chip${filter === 'intermediate' ? ' active' : ''}`} type="button" onClick={() => setFilter('intermediate')}>Intermediate</button>
          </div>
          <div className="package-grid" id="packageGrid">
            {filteredTours.map((tour) => (
              <article className="package" key={tour.id} data-reveal>
                <div className="package-media">
                  <img
                    src={tourImage(tour, 1200)}
                    sizes="(max-width: 900px) 100vw, 50vw"
                    width="1200"
                    height="760"
                    alt={`${tour.name} canyoning adventure in Bali — ${tour.level}`}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="package-badges">
                    <span className={`badge ${tour.badgeClass || 'light'}`}>{tour.badge}</span>
                    <span className="badge light">{tour.level}</span>
                  </div>
                </div>
                <div className="package-body">
                  <div className="package-title-row"><h3>{tour.name}</h3></div>
                  <p className="desc">{tour.short}</p>
                  <div className="package-meta">
                    <span><Icon name="clock" /> {tour.duration}</span>
                    <span><Icon name="users" /> {tour.group}</span>
                    <span><Icon name="shield" /> Min age {tour.minAge}</span>
                    <span><Icon name="water" /> Swim: {tour.swim}</span>
                  </div>
                  <div className="feature-chips">{tour.inclusions.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div>
                  <div className="package-foot">
                    <div className="price">
                      <small>From / person</small>
                      <strong data-money={tour.price}>{formatMoney(tour.price, currency)}</strong>
                      <span className="converted" data-idr={tour.price}>{convertedPrice(tour.price, currency)}</span>
                    </div>
                    <div className="package-actions">
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => openTourDetail(tour.id)}>Details</button>
                      <button className="btn btn-primary btn-sm" type="button" onClick={() => openBooking(tour.id)}>Check availability</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="private-banner" data-reveal>
            <span><b>Traveling with a group of 6–10?</b> We can arrange a private canyon day around your group.</span>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => openBooking()}>Ask for a private quote <Icon name="arrow" /></button>
          </div>
          <div className="compare-block" data-reveal>
            <div className="compare-head">
              <div><span className="kicker">Compare at a glance</span><h3>Which canyon is right for you?</h3></div>
              <p>Swipe to compare on mobile →</p>
            </div>
            <div className="compare-wrap">
              <table className="compare-table">
                <caption className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Comparison of Egar, Maboya, Samba and Aling canyoning tours</caption>
                <thead><tr><th scope="col">Canyon</th>{tours.map((tour) => <th scope="col" key={tour.id}>{tour.name.replace(' Canyon', '')}</th>)}</tr></thead>
                <tbody id="compareTable">
                  {[
                    ['Level', (tour) => tour.level],
                    ['Duration', (tour) => tour.duration],
                    ['Minimum age', (tour) => `${tour.minAge}+`],
                    ['Swimming', (tour) => tour.swim],
                    ['Jumps', (tour) => tour.jumps],
                    ['Natural slides', (tour) => tour.slides],
                    ['Group size', (tour) => tour.group],
                    ['Best for', (tour) => tour.bestFor],
                    ['Price / person', (tour) => <span className="price-cell" data-money={tour.price}>{formatMoney(tour.price, currency)}</span>],
                    ['Book', (tour) => <a href="#" onClick={(event) => { event.preventDefault(); openBooking(tour.id); }}>Check availability →</a>],
                  ].map(([label, render], index, rows) => (
                    <tr key={label} className={index === rows.length - 1 ? 'book-cell' : undefined}>
                      <th scope="row">{label}</th>
                      {tours.map((tour) => <td key={tour.id}>{render(tour)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="section why-us" id="about">
        <div className="wrap split">
          <div className="media-stack" data-reveal>
            <img className="media-main" src="/assets/tours/samba.webp" width="934" height="1400" alt="A canyoning guide rappelling down a tall jungle waterfall in Bali" loading="lazy" decoding="async" style={{ objectPosition: 'center 20%' }} />
            <img className="media-secondary" src="https://images.pexels.com/photos/4534200/pexels-photo-4534200.jpeg?auto=compress&cs=tinysrgb&w=800" width="800" height="600" alt="A canyoning guide rappelling beside a waterfall" loading="lazy" decoding="async" />
            <div className="stat-float"><span className="stars" aria-hidden="true">★★★★★</span><strong>4.9/5</strong><span>from 312 guest reviews</span></div>
          </div>
          <div className="why-copy" data-reveal>
            <span className="kicker">More than a tour</span>
            <h2>Real adventure.<br />Thoughtfully guided.</h2>
            <p className="lead">A great canyoning day is about more than the descent. It is about feeling prepared, supported and free to enjoy the wild world around you.</p>
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
            <a className="btn btn-dark" href="#safety">Our safety approach <Icon name="arrow" /></a>
          </div>
        </div>
        <div className="wrap guides">
          <div className="section-head compact" data-reveal>
            <div><span className="kicker">The people behind the ropes</span><h3>Meet your guides.</h3></div>
            <p>Local knowledge, calm instruction and a genuine love for the canyon.</p>
          </div>
          <div className="guide-grid" id="guideGrid">
            {guides.map((guide) => (
              <article className="guide-card" key={guide.id || guide.name} data-reveal>
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

      {/* HOW IT WORKS */}
      <section className="section" id="how-it-works">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div><span className="kicker">Simple from start to finish</span><h2>Your adventure, in 3 steps.</h2></div>
            <p>Know what happens next before you book. No confusing process and no hidden steps.</p>
          </div>
          <div className="steps" data-reveal>
            <article className="step"><div className="step-no">01</div><h3>Choose your canyon</h3><p>Compare difficulty, duration and inclusions. Use our 30-second quiz if you are not sure which route fits.</p><small>2 minutes</small></article>
            <article className="step"><div className="step-no">02</div><h3>Check availability</h3><p>Send your date and group size. We reply within 15 minutes during business hours, 08:00–20:00 WITA.</p><small>15-minute reply</small></article>
            <article className="step"><div className="step-no">03</div><h3>Confirm &amp; go</h3><p>Review your trip, then secure it with a 25% deposit or pay in full. Card, bank transfer and QRIS are available in the demo checkout.</p><small>Demo payment gateway</small></article>
          </div>
        </div>
      </section>

      {/* LEARN MORE */}
      <section className="section learn-section" id="learn-more" aria-labelledby="learnTitle">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div><span className="kicker">Good to know</span><h2 id="learnTitle">Learn more about our canyoning Bali tour.</h2></div>
            <div className="head-side">
              <p>New to canyoning? Here is everything you need to know about the day, who can join and what is included.</p>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => openBooking()}>Check availability <Icon name="arrow" /></button>
            </div>
          </div>
          <div className="learn-grid" data-reveal>
            {LEARN_CARDS.map((card) => (
              <article className="learn-card" key={card.title}>
                <span className="learn-icon"><Icon name={card.icon} /></span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
          <div className="learn-foot" data-reveal>
            <span><b>Still have questions about the tour?</b> We usually reply within 15 minutes during opening hours, 08:00–20:00 WITA.</span>
            <div className="learn-foot-actions">
              <a className="btn btn-outline btn-sm" href={site.whatsapp || `https://wa.me/${site.phoneHref}`} target="_blank" rel="noopener noreferrer">Ask on WhatsApp <Icon name="wa" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section className="section safety" id="safety">
        <div className="wrap safety-grid">
          <div data-reveal>
            <span className="kicker">Adventure with confidence</span>
            <h2>Good adventures start with good preparation.</h2>
            <p className="lead">Canyoning is an outdoor adventure activity. The right route, suitable conditions, proper equipment and qualified guidance matter. Tell us about your experience, health and comfort in water before you book.</p>
            <ul className="checklist">
              <li className="check"><Icon name="check" /><span>Receive a safety briefing and follow your guide's instructions.</span></li>
              <li className="check"><Icon name="check" /><span>Use the required canyoning equipment and check the fit.</span></li>
              <li className="check"><Icon name="check" /><span>Tell us about relevant medical conditions or concerns.</span></li>
              <li className="check"><Icon name="check" /><span>Confirm swimming requirements, age limits and fitness level.</span></li>
              <li className="check"><Icon name="check" /><span>Understand weather-related changes and cancellation arrangements.</span></li>
            </ul>
            <button className="btn btn-dark" type="button" onClick={() => openPolicy('safety')}>Read our safety commitment <Icon name="arrow" /></button>
          </div>
          <div className="safety-card" data-reveal>
            <h3>Before you head into the canyon</h3>
            <div className="safety-list">
              <div className="check"><Icon name="check" /><span>Safety briefing before every descent.</span></div>
              <div className="check"><Icon name="check" /><span>Harness, helmet and wetsuit fitted and checked.</span></div>
              <div className="check"><Icon name="check" /><span>Water levels and weather assessed daily.</span></div>
              <div className="check"><Icon name="check" /><span>Routes adjusted or cancelled if conditions are unsafe.</span></div>
              <div className="check"><Icon name="check" /><span>Emergency action plan and local rescue contacts.</span></div>
            </div>
            <div className="safety-note">Travel insurance is recommended for all adventure activities. Ask us for our full safety and insurance details before booking.</div>
          </div>
        </div>
        <div className="wrap safety-stats" data-reveal>
          <div><strong>1:4</strong><span>guide-to-guest ratio</span></div>
          <div><strong>8</strong><span>guests max per group</span></div>
          <div><strong>Daily</strong><span>equipment checks</span></div>
          <div><strong>24/7</strong><span>emergency contact</span></div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section" id="reviews">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div><span className="kicker">Stories from the canyon</span><h2>Memories worth sharing.</h2></div>
            <p>Real words from guests who trusted us with their Bali adventure.</p>
          </div>
          <div className="review-summary" data-reveal>
            <div className="rating-big">
              <strong>4.9</strong>
              <div><span className="stars" aria-hidden="true">★★★★★</span><span>from 312 guest reviews</span></div>
            </div>
            <div className="rating-bars" aria-hidden="true">
              <div className="rating-bar"><span>5</span><span className="bar"><i style={{ width: '92%' }} /></span><span>92%</span></div>
              <div className="rating-bar"><span>4</span><span className="bar"><i style={{ width: '6%' }} /></span><span>6%</span></div>
              <div className="rating-bar"><span>3</span><span className="bar"><i style={{ width: '2%' }} /></span><span>2%</span></div>
              <div className="rating-bar"><span>2</span><span className="bar"><i style={{ width: '0%' }} /></span><span>0%</span></div>
              <div className="rating-bar"><span>1</span><span className="bar"><i style={{ width: '0%' }} /></span><span>0%</span></div>
            </div>
            <div className="rating-cta">
              <span>98% of guests would recommend us</span>
              <a className="btn btn-outline btn-sm" href="https://www.google.com/maps/" target="_blank" rel="noopener noreferrer">Read all reviews <Icon name="arrow" /></a>
            </div>
          </div>
          <div className="review-grid" id="reviewGrid">
            {reviews.map((review) => (
              <article className="review" key={review.id || review.name} data-reveal>
                <div className="review-top">
                  <Stars rating={review.rating} />
                  <span className="review-source">{review.source}</span>
                </div>
                <blockquote>“{review.quote}”</blockquote>
                <div className="reviewer">
                  <span className="reviewer-avatar" style={{ background: review.color }} aria-hidden="true">{review.initials}</span>
                  <div><b>{review.name}</b><small>{review.country} · {review.date}</small></div>
                  <span className="review-tour">{String(review.tour).replace(' Canyon', '')}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="section gallery-section" id="gallery">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div><span className="kicker">Postcards from the canyon</span><h2>This is what you came for.</h2></div>
            <a className="btn btn-ghost btn-sm" href={site.instagram || 'https://www.instagram.com/'} target="_blank" rel="noopener noreferrer">Follow @canyoningbali <Icon name="instagram" /></a>
          </div>
          <div className="gallery-grid" id="galleryGrid">
            {gallery.map((image, index) => (
              <button className="gallery-item" key={image.id} type="button" onClick={() => openLightbox(index)} aria-label={`Open photo: ${image.caption}`} data-reveal>
                <img
                  src={photoUrl(image.id, 800)}
                  sizes="(max-width: 680px) 50vw, 33vw"
                  width="800"
                  height="600"
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                />
                <span>{image.caption}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section className="section article-section" id="articles">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div><span className="kicker">Stories &amp; guides</span><h2>Read before you descend.</h2></div>
            <p className="head-side">Practical guides, canyon comparisons and honest advice from the people who run these routes every week.</p>
          </div>
          <div className="article-grid" id="articleGrid" data-reveal>
            {articles.slice(0, 3).map((article) => (
              <a
                className="article-card"
                key={article.slug}
                href="#articles"
                onClick={(event) => { event.preventDefault(); openArticle(article.slug); }}
              >
                <div className="article-media">
                  <img src={articleImage(article, 800)} alt={article.title} width="800" height="500" loading="lazy" decoding="async" />
                  <span className="article-tag">{article.kicker}</span>
                </div>
                <div className="article-body">
                  <div className="article-meta">
                    <span>{articleDate(article.meta)}</span><i /><span>{(article.meta || '').split('·')[1]?.trim()}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{articleExcerpt(article) || 'Read the full story from the Canyoning Bali team.'}</p>
                  <span className="article-more">Read article <Icon name="arrow" /></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="wrap faq-layout">
          <div className="faq-intro" data-reveal>
            <span className="kicker">Good to know</span>
            <h2>Questions, answered.</h2>
            <p>Everything you need to know before your canyoning day. Still unsure? We are one message away.</p>
            <a className="btn btn-dark" href={site.whatsapp || `https://wa.me/${site.phoneHref}`} target="_blank" rel="noopener noreferrer">Ask us on WhatsApp <Icon name="wa" /></a>
            <div className="faq-note"><strong>Reply time</strong><span>Within 15 minutes, 08:00–20:00 WITA.</span></div>
          </div>
          <div className="faq-list" data-reveal>
            {faqs.map(([question, answer], index) => (
              <details className="faq-item" key={question} open={index === 0}>
                <summary>{question}<span className="faq-icon" aria-hidden="true" /></summary>
                <div className="faq-answer">{answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="section contact-section" id="contact">
        <div className="wrap contact-grid">
          <div className="contact-copy" data-reveal>
            <span className="kicker">Contact us</span>
            <h2>Talk to a real guide.</h2>
            <p className="lead">Questions about water levels, private groups, pickup or which canyon fits your family? Message us — we usually reply within 15 minutes during opening hours.</p>
            <div className="contact-list">
              <div className="contact-item">
                <span className="contact-icon"><Icon name="wa" /></span>
                <div><small>WhatsApp</small><a href={site.whatsapp || `https://wa.me/${site.phoneHref}`} target="_blank" rel="noopener noreferrer">{site.phone}</a></div>
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
            <div className="contact-actions">
              <a className="btn btn-primary" href={site.whatsapp || `https://wa.me/${site.phoneHref}`} target="_blank" rel="noopener noreferrer">WhatsApp us <Icon name="wa" /></a>
              <a className="btn btn-ghost" href={`mailto:${site.email}`}>Send an email <Icon name="mail" /></a>
            </div>
          </div>
          <div className="contact-card" data-reveal>
            <h3>Send a quick message</h3>
            <p>Tell us your date, group size and what you would like to know. This demo form opens WhatsApp with your message ready to send.</p>
            <form className="contact-form" id="contactForm" noValidate onSubmit={onSubmitContact}>
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
            <p className="form-note">Demo contact form — no message is stored on this website. Prefer email? Write to <a href={`mailto:${site.email}`} style={{ color: 'var(--brand-dark)', textDecoration: 'underline' }}>{site.email}</a>.</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta-section">
        <div className="wrap">
          <div className="final-cta" data-reveal>
            <div>
              <span className="kicker">Your next story starts here</span>
              <h2>Ready to discover another side of Bali?</h2>
              <p>Tell us your date and which canyon caught your eye. We will take care of the rest.</p>
            </div>
            <div className="final-actions">
              <button className="btn btn-primary" type="button" onClick={() => openBooking()}>Check availability <Icon name="arrow" /></button>
              <a className="btn btn-outline" href={site.whatsapp || `https://wa.me/${site.phoneHref}`} target="_blank" rel="noopener noreferrer"><Icon name="wa" /> WhatsApp us</a>
              <small>Deposit or pay in full · Reply within 15 min</small>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}