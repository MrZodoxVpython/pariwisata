import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function CookieBanner() {
  const { openPolicy } = useApp();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let consent = null;
    try {
      consent = localStorage.getItem('cb_consent');
    } catch (err) {
      /* ignore */
    }
    if (consent) return undefined;
    const timer = setTimeout(() => setShow(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const choose = (value) => {
    try {
      localStorage.setItem('cb_consent', value);
    } catch (err) {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div className={`cookie-banner${show ? ' show' : ''}`} role="region" aria-label="Cookie consent">
      <span>
        We use privacy-friendly analytics to improve this site. You can accept or continue with essential cookies only.{' '}
        <a href="#" onClick={(event) => { event.preventDefault(); openPolicy('privacy'); }}>Privacy policy</a>.
      </span>
      <div className="cookie-actions">
        <button className="btn btn-ghost" type="button" onClick={() => choose('essential')}>Essential only</button>
        <button className="btn btn-primary" type="button" onClick={() => choose('accepted')}>Accept analytics</button>
      </div>
    </div>
  );
}