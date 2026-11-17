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
import Toast from './components/Toast';
import { AppProvider, useApp } from './context/AppContext';

function Splash({ error, onRetry }) {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[#0093DD] mx-auto mb-6 grid place-items-center">
          <svg width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M10 42c8-13 13-13 22 0s14 13 22 0" stroke="white" strokeWidth="5" strokeLinecap="round" />
            <path d="M18 27c5-8 9-8 14 0s9 8 14 0" stroke="white" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        {error ? (
          <>
            <h1 className="text-xl font-extrabold mb-2">Cannot reach the API</h1>
            <p className="text-sm text-muted mb-6">{error}</p>
            <button type="button" className="btn-primary" onClick={onRetry}>
              Try again
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-extrabold mb-2">Canyoning Bali</h1>
            <p className="text-sm text-muted">Loading canyons, guides and stories…</p>
          </>
        )}
      </div>
    </div>
  );
}

function AppShell() {
  const { loading, error, reload, content } = useApp();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    if (loading) return undefined;
    const elements = Array.from(document.querySelectorAll('.data-reveal'));
    if (!elements.length) return undefined;

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
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

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, location.pathname, content]);

  if (loading) return <Splash />;
  if (error && !content.tours.length) return <Splash error={error} onRetry={reload} />;

  return (
    <div className="min-h-screen flex flex-col relative">
      <Toast />
      <Navbar />
      <main id="main-content" className="flex-1 pt-16 pb-16 md:pb-0">
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
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}