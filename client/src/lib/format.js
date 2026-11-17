export const formatIDR = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export function photoUrl(id, width = 800) {
  if (!id) return '';
  if (id.startsWith('assets/') || id.startsWith('/')) {
    return id.startsWith('/') ? id : `/${id}`;
  }
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

export function tourImage(tour, width = 800) {
  return photoUrl(tour?.galleryIds?.[0] || tour?.image, width);
}

export function articleImage(article, width = 800) {
  return photoUrl(article?.imageId, width);
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