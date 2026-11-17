import { useEffect, useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import { useApp, useSite } from '../context/AppContext';
import { formatMoney, photoUrl } from '../lib/format';

export default function TourDialog() {
  const { tourDetailId, closeTourDetail, content, currency, openBooking } = useApp();
  const site = useSite();
  const tour = content.tours.find((item) => item.id === tourDetailId);
  const open = Boolean(tourDetailId && tour);
  const [heroImage, setHeroImage] = useState('');

  useEffect(() => {
    if (!tour) return;
    setHeroImage(photoUrl(tour.image || tour.galleryIds?.[0], 1200));
  }, [tour]);

  if (!tour) {
    return <Dialog open={false} onClose={closeTourDetail} className="tour-dialog" labelledBy="tourDialogTitle"><div /></Dialog>;
  }

  const gallery = (tour.galleryIds || []).map((id) => photoUrl(id, 1200));
  const whatsappHref = `${site.whatsapp || `https://wa.me/${site.phoneHref}`}?text=${encodeURIComponent(`Hi, I have a question about ${tour.name}.`)}`;

  return (
    <Dialog open={open} onClose={closeTourDetail} className="tour-dialog" labelledBy="tourDialogTitle">
      <div className="dialog-card tour-card">
        <button className="dialog-close" type="button" onClick={closeTourDetail} aria-label="Close canyon details"><Icon name="close" /></button>
        <div className="tour-hero">
          <img id="tourHeroImg" src={heroImage} alt="" width="1200" height="800" />
          <div className="tour-hero-copy">
            <span className="badge lime" id="tourBadge">{tour.level}</span>
            <h2 id="tourDialogTitle">{tour.name}</h2>
            <p id="tourSub">{tour.short}</p>
            <div className="tour-thumbs" id="tourThumbs" aria-label="Canyon photo gallery">
              {gallery.map((src, index) => (
                <button key={src + index} type="button" className={heroImage === src ? 'active' : ''} onClick={() => setHeroImage(src)} aria-label={`${tour.name} photo ${index + 1}`}>
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="tour-body">
          <div>
            <div className="tour-quick" id="tourQuick">
              <div><small>Duration</small><b>{tour.duration}</b></div>
              <div><small>Min age</small><b>{tour.minAge}+</b></div>
              <div><small>Swimming</small><b>{tour.swim}</b></div>
              <div><small>Jumps</small><b>{tour.jumps}</b></div>
              <div><small>Slides</small><b>{tour.slides}</b></div>
              <div><small>Group</small><b>{tour.group}</b></div>
            </div>
            <h3>Your day, step by step</h3>
            <ol className="timeline" id="tourItinerary">
              {(tour.itinerary || []).map((item) => (
                <li key={item.time + item.title}>
                  <time>{item.time}</time>
                  <b>{item.title}</b>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
            <div className="tour-cols">
              <div><h3>What's included</h3><ul id="tourInclusions">{(tour.inclusions || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3>Not included</h3><ul id="tourExclusions" className="no">{(tour.exclusions || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <div className="tour-cols">
              <div><h3>Requirements</h3><ul id="tourRequirements">{(tour.requirements || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3>What to bring</h3><ul id="tourBring">{(tour.bring || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <div className="tour-note" id="tourCancellation">{tour.cancellation}</div>
          </div>
          <aside className="tour-aside">
            <span className="from">From</span>
            <strong id="tourPrice">{formatMoney(tour.price, currency)}</strong>
            <small>per person · pickup available</small>
            <button className="btn btn-primary" type="button" id="tourBookBtn" onClick={() => { closeTourDetail(); openBooking(tour.id); }}>Check availability <Icon name="arrow" /></button>
            <a className="btn btn-ghost" id="tourWaBtn" href={whatsappHref} target="_blank" rel="noopener noreferrer"><Icon name="wa" /> Ask a question</a>
            <div className="tour-aside-note">Deposit or pay in full · Free cancellation 48h</div>
          </aside>
        </div>
      </div>
    </Dialog>
  );
}