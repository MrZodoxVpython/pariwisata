export function serializeTour(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    short: row.short,
    level: row.level,
    levelKey: row.level_key,
    badge: row.badge,
    badgeClass: row.badge_class,
    duration: row.duration,
    minAge: row.min_age,
    maxWeight: row.max_weight,
    swim: row.swim,
    jumps: row.jumps,
    slides: row.slides,
    group: row.group_size,
    price: Number(row.price),
    image: row.image,
    galleryIds: row.gallery_ids || [],
    bestFor: row.best_for,
    long: row.long_description,
    itinerary: row.itinerary || [],
    inclusions: row.inclusions || [],
    exclusions: row.exclusions || [],
    requirements: row.requirements || [],
    bring: row.bring || [],
    meeting: row.meeting,
    cancellation: row.cancellation,
  };
}

export function serializePickup(row) {
  return {
    id: row.id,
    label: row.label,
    fee: Number(row.fee),
  };
}

export function serializeReview(row) {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    date: row.date_label,
    tour: row.tour,
    rating: row.rating,
    source: row.source,
    initials: row.initials,
    color: row.color,
    quote: row.quote,
  };
}

export function serializeGuide(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    years: row.years,
    bio: row.bio,
    languages: row.languages,
    initials: row.initials,
    color: row.color,
  };
}

export function serializeGalleryImage(row) {
  return { id: row.id, caption: row.caption, alt: row.alt };
}

export function serializeArticle(row) {
  return {
    slug: row.slug,
    kicker: row.kicker,
    title: row.title,
    meta: row.meta,
    imageId: row.image_id,
    body: row.body,
  };
}

export function serializePolicy(row) {
  return { slug: row.slug, title: row.title, html: row.html };
}

export function serializeQuizQuestion(row) {
  return {
    id: row.id,
    key: row.key,
    q: row.question,
    options: row.options || [],
  };
}

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function serializeBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    tourId: row.tour_id,
    tourName: row.tour_name,
    date: toDateOnly(row.date),
    people: row.people,
    pickupId: row.pickup_id,
    pickupName: row.pickup_name,
    pickupFee: Number(row.pickup_fee),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function serializeContactMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    preferredDate: toDateOnly(row.preferred_date),
    people: row.people,
    tourId: row.tour_id,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}