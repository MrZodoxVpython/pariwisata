import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { formatMoney, tourImage } from '../lib/format';

export default function Packages() {
  const { content, currency, openBooking, openTourDetail, openQuiz } = useApp();
  const [filter, setFilter] = useState('all');
  const tours = content.tours;
  const list = useMemo(
    () => tours.filter((tour) => filter === 'all' || tour.levelKey === filter),
    [tours, filter]
  );

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <span className="kicker">Canyoning tours</span>
          <h1>Four canyons. One unforgettable day.</h1>
          <p>From your first rappel to a full-day technical descent, choose the route that matches your confidence and experience.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" type="button" onClick={() => openBooking()}>Check availability <Icon name="arrow" /></button>
            <button className="btn btn-outline" type="button" onClick={openQuiz}>Find my canyon <Icon name="arrow" /></button>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap">
          <div className="filters" role="group" aria-label="Filter canyons by level">
            <button className={`chip${filter === 'all' ? ' active' : ''}`} type="button" onClick={() => setFilter('all')}>All canyons</button>
            <button className={`chip${filter === 'beginner' ? ' active' : ''}`} type="button" onClick={() => setFilter('beginner')}>Beginner</button>
            <button className={`chip${filter === 'intermediate' ? ' active' : ''}`} type="button" onClick={() => setFilter('intermediate')}>Intermediate</button>
          </div>
          <div className="package-grid">
            {list.map((tour) => (
              <article className="package" key={tour.id}>
                <div className="package-media">
                  <img src={tourImage(tour, 1200)} width="1200" height="760" alt={`${tour.name} canyoning adventure in Bali — ${tour.level}`} loading="lazy" decoding="async" />
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
                      <strong>{formatMoney(tour.price, currency)}</strong>
                      <span className="converted">{currency === 'IDR' ? 'Billed in IDR' : `≈ ${formatMoney(tour.price, 'IDR')}`}</span>
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
        </div>
      </section>

      <section className="page-section alt">
        <div className="wrap">
          <div className="section-head">
            <div><span className="kicker">Compare at a glance</span><h2>Which canyon is right for you?</h2></div>
            <p>Swipe to compare on mobile →</p>
          </div>
          <div className="compare-wrap">
            <table className="compare-table">
              <thead><tr><th scope="col">Canyon</th>{tours.map((tour) => <th scope="col" key={tour.id}>{tour.name.replace(' Canyon', '')}</th>)}</tr></thead>
              <tbody>
                {[
                  ['Level', (tour) => tour.level],
                  ['Duration', (tour) => tour.duration],
                  ['Minimum age', (tour) => `${tour.minAge}+`],
                  ['Swimming', (tour) => tour.swim],
                  ['Jumps', (tour) => tour.jumps],
                  ['Natural slides', (tour) => tour.slides],
                  ['Group size', (tour) => tour.group],
                  ['Best for', (tour) => tour.bestFor],
                  ['Price / person', (tour) => <span className="price-cell">{formatMoney(tour.price, currency)}</span>],
                ].map(([label, render]) => (
                  <tr key={label}><th scope="row">{label}</th>{tours.map((tour) => <td key={tour.id}>{render(tour)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}