import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Packages from './pages/Packages';
import PackageDetail from './pages/PackageDetail';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Contact from './pages/Contact';
import PolicyPage from './pages/PolicyPage';
import NotFound from './pages/NotFound';
import BookingDialog from './components/BookingDialog';
import ArticleDialog from './components/ArticleDialog';
import QuizDialog from './components/QuizDialog';
import PolicyDialog from './components/PolicyDialog';
import TourDialog from './components/TourDialog';
import LightboxDialog from './components/LightboxDialog';
import Toast from './components/Toast';
import CookieBanner from './components/CookieBanner';
import { IconSprite } from './components/Icon';
import { AppProvider, useApp } from './context/AppContext';

function Splash({ error, onRetry }) {
  return (
    <div className="wrap" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#0093DD', margin: '0 auto 20px', display: 'grid', placeItems: 'center' }}>
          <svg width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M10 42c8-13 13-13 22 0s14 13 22 0" stroke="white" strokeWidth="5" strokeLinecap="round" />
            <path d="M18 27c5-8 9-8 14 0s9 8 14 0" stroke="white" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        {error ? (
          <>
            <h2 style={{ fontSize: 28 }}>{/DATABASE_URL/i.test(error) ? 'Database belum dikonfigurasi' : 'Cannot reach the API'}</h2>
            <p className="muted" style={{ margin: '10px 0 20px', fontSize: 13 }}>{error}</p>
            <button type="button" className="btn btn-primary" onClick={onRetry}>Try again</button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 28 }}>Canyoning Bali</h2>
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>Loading canyons, guides and stories...</p>
          </>
        )}
      </div>
    </div>
  );
}

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    return undefined;
  }, [location.pathname, location.hash]);
  return null;
}

function AppShell() {
  const { loading, error, reload, content, bookingTourId, articleSlug, quizOpen, policyKey, tourDetailId, lightboxIndex } = useApp();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const modalOpen = bookingTourId !== null || Boolean(articleSlug) || quizOpen || Boolean(policyKey) || Boolean(tourDetailId) || lightboxIndex !== null;

  useEffect(() => {
    document.body.classList.toggle('modal-open', modalOpen);
    return () => document.body.classList.remove('modal-open');
  }, [modalOpen]);

  useEffect(() => {
    if (loading) return undefined;
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, location.pathname, content]);

  if (loading) return <Splash />;
  if (error && !content.tours.length) return <Splash error={error} onRetry={reload} />;

  return (
    <>
      <IconSprite />
      <Navbar />
      <main id="main" className={isHome ? undefined : 'page-main'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/packages/:id" element={<PackageDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:slug" element={<ArticleDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PolicyPage type="privacy" />} />
          <Route path="/terms" element={<PolicyPage type="terms" />} />
          <Route path="/cancellation" element={<PolicyPage type="cancellation" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <BottomNav />
      <BookingDialog />
      <ArticleDialog />
      <QuizDialog />
      <PolicyDialog />
      <TourDialog />
      <LightboxDialog />
      <Toast />
      <CookieBanner />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ScrollManager />
      <AppShell />
    </AppProvider>
  );
}