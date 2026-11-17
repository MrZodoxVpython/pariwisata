import { Router } from 'express';
import { query } from '../lib/db.js';
import { asyncHandler, httpError } from '../lib/http.js';
import { loadContent } from '../lib/content.js';
import { getAvailability } from '../lib/availability.js';
import {
  serializeTour,
  serializePickup,
  serializeReview,
  serializeGuide,
  serializeGalleryImage,
  serializeArticle,
  serializePolicy,
} from '../lib/serializers.js';

const router = Router();

router.get(
  '/content',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await loadContent() });
  })
);

router.get(
  '/tours',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from public.tours where active = true order by sort_order, name'
    );
    res.json({ success: true, tours: rows.map(serializeTour) });
  })
);

router.get(
  '/tours/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from public.tours where id = $1 and active = true',
      [req.params.id]
    );
    if (!rows[0]) throw httpError(404, 'Tour not found');
    res.json({ success: true, tour: serializeTour(rows[0]) });
  })
);

router.get(
  '/pickups',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from public.pickups where active = true order by sort_order, label'
    );
    res.json({ success: true, pickups: rows.map(serializePickup) });
  })
);

router.get(
  '/reviews',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from public.reviews where published = true order by sort_order, id'
    );
    res.json({ success: true, reviews: rows.map(serializeReview) });
  })
);

router.get(
  '/guides',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.guides order by sort_order, id');
    res.json({ success: true, guides: rows.map(serializeGuide) });
  })
);

router.get(
  '/gallery',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.gallery order by sort_order, id');
    res.json({ success: true, gallery: rows.map(serializeGalleryImage) });
  })
);

router.get(
  '/articles',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from public.articles where published = true order by sort_order, title'
    );
    res.json({ success: true, articles: rows.map(serializeArticle) });
  })
);

router.get(
  '/articles/:slug',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from public.articles where slug = $1 and published = true',
      [req.params.slug]
    );
    if (!rows[0]) throw httpError(404, 'Article not found');
    res.json({ success: true, article: serializeArticle(rows[0]) });
  })
);

router.get(
  '/availability',
  asyncHandler(async (req, res) => {
    const tourId = typeof req.query.tourId === 'string' ? req.query.tourId.trim().slice(0, 80) : '';
    const date = typeof req.query.date === 'string' ? req.query.date.trim().slice(0, 10) : '';
    if (!tourId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw httpError(400, 'tourId and date (YYYY-MM-DD) are required');
    }
    const availability = await getAvailability(tourId, date);
    if (!availability) throw httpError(404, 'Tour not found');
    res.json({ success: true, availability });
  })
);

router.get(
  '/policies/:slug',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from public.policies where slug = $1', [
      req.params.slug,
    ]);
    if (!rows[0]) throw httpError(404, 'Policy not found');
    res.json({ success: true, policy: serializePolicy(rows[0]) });
  })
);

export default router;