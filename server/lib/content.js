import { query } from '../lib/db.js';
import {
  serializeTour,
  serializePickup,
  serializeReview,
  serializeGuide,
  serializeGalleryImage,
  serializeArticle,
  serializePolicy,
  serializeQuizQuestion,
} from '../lib/serializers.js';

export async function loadContent() {
  const [
    site,
    tours,
    pickups,
    reviews,
    guides,
    gallery,
    articles,
    faqs,
    policies,
    quiz,
  ] = await Promise.all([
    query('select * from public.site_settings where id = 1'),
    query('select * from public.tours where active = true order by sort_order, name'),
    query('select * from public.pickups where active = true order by sort_order, label'),
    query('select * from public.reviews where published = true order by sort_order, id'),
    query('select * from public.guides order by sort_order, id'),
    query('select * from public.gallery order by sort_order, id'),
    query('select * from public.articles where published = true order by sort_order, title'),
    query('select * from public.faqs where published = true order by sort_order, id'),
    query('select * from public.policies order by slug'),
    query('select * from public.quiz_questions order by sort_order, id'),
  ]);

  const siteRow = site.rows[0];

  return {
    site: siteRow
      ? {
          name: siteRow.name,
          url: siteRow.url,
          phone: siteRow.phone,
          phoneHref: siteRow.phone_href,
          email: siteRow.email,
          address: siteRow.address,
          hours: siteRow.hours,
          instagram: siteRow.instagram,
          facebook: siteRow.facebook,
          whatsapp: siteRow.whatsapp,
          currency: siteRow.currency,
        }
      : null,
    tours: tours.rows.map(serializeTour),
    pickups: pickups.rows.map(serializePickup),
    reviews: reviews.rows.map(serializeReview),
    guides: guides.rows.map(serializeGuide),
    gallery: gallery.rows.map(serializeGalleryImage),
    articles: articles.rows.map(serializeArticle),
    faqs: faqs.rows.map((row) => ({ id: row.id, q: row.question, a: row.answer })),
    policies: Object.fromEntries(policies.rows.map((row) => [row.slug, serializePolicy(row)])),
    quiz: quiz.rows.map(serializeQuizQuestion),
  };
}