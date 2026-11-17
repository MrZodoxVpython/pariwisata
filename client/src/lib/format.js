export const RATES = { IDR: 1, USD: 0.000062, EUR: 0.000057, AUD: 0.000094 };

const moneyFormatters = {};

export function formatMoney(idr, currency = 'IDR') {
  const cur = RATES[currency] ? currency : 'IDR';
  if (!moneyFormatters[cur]) {
    moneyFormatters[cur] = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    });
  }
  const formatted = moneyFormatters[cur].format(Number(idr || 0) * RATES[cur]);
  return cur === 'IDR' ? formatted : `≈ ${formatted}`;
}

export const formatIDR = (value) => formatMoney(value, 'IDR');

export function photoUrl(id, width = 800) {
  if (!id) return '';
  const src = String(id);
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
  if (/^\d+$/.test(src)) {
    return `https://images.pexels.com/photos/${src}/pexels-photo-${src}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
  }
  return src.startsWith('/') ? src : `/${src}`;
}

export function tourImage(tour, width = 1200) {
  return photoUrl(tour?.image || tour?.galleryIds?.[0], width);
}

export function articleImage(article, width = 800) {
  return photoUrl(article?.imageId, width);
}

const ARTICLE_EXCERPTS = {
  'first-canyon': 'From the safety briefing to your first rappel — a realistic walkthrough of the day, nerves included.',
  'choose-canyon': 'Difficulty, swims, rappel heights and who each route suits best — a side-by-side comparison.',
  'packing-list': 'The short list that makes a difference, plus the things that are better left at the hotel.',
};

export function articleExcerpt(article) {
  if (article?.slug && ARTICLE_EXCERPTS[article.slug]) return ARTICLE_EXCERPTS[article.slug];
  return (article?.body || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

export function articleDate(meta = '') {
  const base = meta.split('·')[0].trim();
  const date = new Date(base);
  if (!base || Number.isNaN(date.getTime())) return base;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}`.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function localISO(date = new Date()) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localISO(d);
}

export function addMonthsISO(iso, months) {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return localISO(d);
}