import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { RATES } from '../lib/format';

const AppContext = createContext(null);

const emptyContent = {
  site: null,
  tours: [],
  pickups: [],
  reviews: [],
  guides: [],
  gallery: [],
  articles: [],
  faqs: [],
  policies: {},
  quiz: [],
};

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (err) {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [content, setContent] = useState(emptyContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bookingTourId, setBookingTourId] = useState(null);
  const [bookingPrefill, setBookingPrefill] = useState(null);
  const [articleSlug, setArticleSlug] = useState(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [policyKey, setPolicyKey] = useState(null);
  const [tourDetailId, setTourDetailId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [toast, setToast] = useState(null);
  const [currency, setCurrencyState] = useState(() => {
    const saved = readStored('cb_currency', 'IDR');
    return RATES[saved] ? saved : 'IDR';
  });

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await api.getContent();
      setContent({ ...emptyContent, ...payload.data });
    } catch (err) {
      setError(err.message || 'Could not load content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const setCurrency = useCallback((next) => {
    if (!RATES[next]) return;
    setCurrencyState(next);
    try {
      localStorage.setItem('cb_currency', next);
    } catch (err) {
      /* ignore */
    }
  }, []);

  const openBooking = useCallback((tourId = '', prefill = null) => {
    setBookingPrefill(prefill);
    setBookingTourId(tourId || '');
  }, []);
  const closeBooking = useCallback(() => {
    setBookingTourId(null);
    setBookingPrefill(null);
  }, []);
  const openArticle = useCallback((slug) => setArticleSlug(slug), []);
  const closeArticle = useCallback(() => setArticleSlug(null), []);
  const openQuiz = useCallback(() => setQuizOpen(true), []);
  const closeQuiz = useCallback(() => setQuizOpen(false), []);
  const openPolicy = useCallback((key) => setPolicyKey(key), []);
  const closePolicy = useCallback(() => setPolicyKey(null), []);
  const openTourDetail = useCallback((id) => setTourDetailId(id), []);
  const closeTourDetail = useCallback(() => setTourDetailId(null), []);
  const openLightbox = useCallback((index) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const value = useMemo(
    () => ({
      content,
      loading,
      error,
      reload: loadContent,
      bookingTourId,
      bookingPrefill,
      openBooking,
      closeBooking,
      articleSlug,
      openArticle,
      closeArticle,
      quizOpen,
      openQuiz,
      closeQuiz,
      policyKey,
      openPolicy,
      closePolicy,
      tourDetailId,
      openTourDetail,
      closeTourDetail,
      lightboxIndex,
      openLightbox,
      closeLightbox,
      toast,
      notify,
      currency,
      setCurrency,
    }),
    [
      content,
      loading,
      error,
      loadContent,
      bookingTourId,
      bookingPrefill,
      openBooking,
      closeBooking,
      articleSlug,
      openArticle,
      closeArticle,
      quizOpen,
      openQuiz,
      closeQuiz,
      policyKey,
      openPolicy,
      closePolicy,
      tourDetailId,
      openTourDetail,
      closeTourDetail,
      lightboxIndex,
      openLightbox,
      closeLightbox,
      toast,
      notify,
      currency,
      setCurrency,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

export function useSite() {
  const { content } = useApp();
  return (
    content.site || {
      name: 'Canyoning Bali',
      phone: '+62 813 3957 8001',
      phoneHref: '6281339578001',
      email: 'hello@canyoningbali.com',
      address: 'Pupuan, Tabanan, North Bali',
      hours: '07:00–20:00 WITA, every day',
      whatsapp: 'https://wa.me/6281339578001',
      instagram: 'https://www.instagram.com/',
      facebook: 'https://www.facebook.com/',
    }
  );
}