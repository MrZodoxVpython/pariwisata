import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

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

export function AppProvider({ children }) {
  const [content, setContent] = useState(emptyContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bookingTourId, setBookingTourId] = useState(null);
  const [articleSlug, setArticleSlug] = useState(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [toast, setToast] = useState(null);

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

  const openBooking = useCallback((tourId = '') => setBookingTourId(tourId), []);
  const closeBooking = useCallback(() => setBookingTourId(null), []);
  const openArticle = useCallback((slug) => setArticleSlug(slug), []);
  const closeArticle = useCallback(() => setArticleSlug(null), []);
  const openQuiz = useCallback(() => setQuizOpen(true), []);
  const closeQuiz = useCallback(() => setQuizOpen(false), []);

  const value = useMemo(
    () => ({
      content,
      loading,
      error,
      reload: loadContent,
      bookingTourId,
      openBooking,
      closeBooking,
      articleSlug,
      openArticle,
      closeArticle,
      quizOpen,
      openQuiz,
      closeQuiz,
      toast,
      notify,
    }),
    [
      content,
      loading,
      error,
      loadContent,
      bookingTourId,
      openBooking,
      closeBooking,
      articleSlug,
      openArticle,
      closeArticle,
      quizOpen,
      openQuiz,
      closeQuiz,
      toast,
      notify,
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
      phone: '+62 812-3456-7890',
      phoneHref: '6281234567890',
      email: 'hello@canyoningbali.com',
      address: 'Desa Sambangan, Sukasada, Buleleng, Bali',
      hours: 'Daily 06:00 – 18:00 WITA',
      whatsapp: 'https://wa.me/6281234567890',
      instagram: 'https://instagram.com/canyoningbali',
      facebook: 'https://facebook.com/canyoningbali',
    }
  );
}