import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container mx-auto px-4 text-center">
        <div className="text-6xl font-extrabold text-[#0093DD] mb-4">404</div>
        <h1 className="text-2xl font-bold mb-3">This trail does not exist</h1>
        <p className="mb-8" style={{ color: 'var(--muted)' }}>The page you are looking for may have moved, or the link is wrong.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary no-underline">Back to home</Link>
          <Link to="/packages" className="btn-ghost no-underline">Browse canyons</Link>
        </div>
      </div>
    </section>
  );
}