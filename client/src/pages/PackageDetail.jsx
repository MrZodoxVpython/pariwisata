import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { useApp, useSite } from '../context/AppContext';
import { formatMoney, photoUrl } from '../lib/format';

export default function PackageDetail() {
  const { id } = useParams();
  const { content, currency, openBooking } = useApp();
  const site = useSite();
  const tour = content.tours.find((item) => item.id === id);

  if (!tour) {
    return (
      <section className="page-section">
        <div className="wrap not-found">
          <div>
            <h1 style={{ fontSize: 48 }}>Canyon not found</h1>
            <p className="muted" style={{ marginBottom: 20 }}>That canyon does not exist or is no longer available.</p>
            <Link className="btn btn-primary" to="/packages">Browse all canyons</Link>
          </div>
        </div>
      </section>
    );
  }

  const gallery = (tour.galleryIds || []).map((item) => photoUrl(item, 1200));
  const whatsappHref = `${site.whatsapp || `https://wa.me/${site.phoneHref}`}?text=${encodeURIComponent(`Hi, I have a question about ${tour.name}.`)}`;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="breadcrumb" style={{ color: 'var(--text-on-dark)' }}>
            <Link to="/" style={{ color: '#9BDCFF' }}>Home</Link><span>/</span>
            <Link to="/packages" style={{ color: '#9BDCFF' }}>Canyons</Link><span>/</span>
            <span>{tour.name}</span>
          </div>
          <span className="badge lime">{tour.badge}</span>
          <h1>{tour.name}</h1>
          <p>{tour.short}</p>
          <div className="hero-actions">
            <button className="btn btn-primary" type="button" onClick={() => openBooking(tour.id)}>Check availability <Icon name="arrow" /></button>
            <a className="btn btn-outline" href={whatsappHref} target="_blank" rel="noopener noreferrer"><Icon name="wa" /> Ask a question</a>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap">
          <div className="tour-quick">
            <div><small>Duration</small><b>{tour.duration}</b></div>
            <div><small>Min age</small><b>{tour.minAge}+</b></div>
            <div><small>Swimming</small><b>{tour.swim}</b></div>
            <div><small>Jumps</small><b>{tour.jumps}</b></div>
            <div><small>Slides</small><b>{tour.slides}</b></div>
            <div><small>Group</small><b>{tour.group}</b></div>
          </div>

          <div className="split" style={{ alignItems: 'start' }}>
            <div>
              <h2>Your day, step by step</h2>
              <ol className="timeline">
                {(tour.itinerary || []).map((item) => (
                  <li key={item.time + item.title}>
                    <time>{item.time}</time>
                    <b>{item.title}</b>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ol>
              <div className="tour-cols">
                <div><h3>What's included</h3><ul>{(tour.inclusions || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><h3>Not included</h3><ul className="no">{(tour.exclusions || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
              <div className="tour-cols">
                <div><h3>Requirements</h3><ul>{(tour.requirements || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><h3>What to bring</h3><ul>{(tour.bring || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
              <div className="tour-note">{tour.cancellation}</div>
            </div>
            <aside className="tour-aside">
              <span className="from">From</span>
              <strong>{formatMoney(tour.price, currency)}</strong>
              <small>per person · pickup available</small>
              <button className="btn btn-primary" type="button" onClick={() => openBooking(tour.id)}>Check availability <Icon name="arrow" /></button>
              <a className="btn btn-ghost" href={whatsappHref} target="_blank" rel="noopener noreferrer"><Icon name="wa" /> Ask a question</a>
              <div className="tour-aside-note">Deposit or pay in full · Free cancellation 48h</div>
            </aside>
          </div>

          <div className="gallery-grid" style={{ marginTop: 48 }}>
            {gallery.map((src, index) => (
              <div className="gallery-item" key={src + index} style={{ cursor: 'default' }}>
                <img src={src} alt={`${tour.name} photo ${index + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}