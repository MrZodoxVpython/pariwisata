import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFound() {
  return (
    <section className="page-section">
      <div className="wrap not-found">
        <div>
          <span className="kicker">404</span>
          <h1 style={{ fontSize: 'clamp(42px, 8vw, 84px)', lineHeight: 1, margin: '12px 0 14px' }}>This trail does not exist.</h1>
          <p className="muted" style={{ maxWidth: 460, margin: '0 auto 24px' }}>
            The page you are looking for may have moved, or the link is wrong. Let's get you back to solid ground.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link className="btn btn-primary" to="/">Back to home <Icon name="arrow" /></Link>
            <Link className="btn btn-ghost" to="/packages">Browse canyons</Link>
            <Link className="btn btn-ghost" to="/contact">Talk to a guide</Link>
          </div>
        </div>
      </div>
    </section>
  );
}