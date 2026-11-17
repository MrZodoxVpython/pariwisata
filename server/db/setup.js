import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { pool, query, withTransaction } from '../lib/db.js';
import { migrate } from './migrate.js';
import {
  SITE,
  PICKUP,
  TOURS,
  REVIEWS,
  GUIDES,
  GALLERY,
  QUIZ,
  POLICIES,
  ARTICLES,
  FAQ,
} from './seed-data/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));

async function applySchema() {
  const sql = await readFile(path.join(here, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✓ schema applied');
}

async function seedFirstAdmin() {
  const { rows } = await query('select count(*)::int as count from public.admin_users');
  if (rows[0].count > 0) return;

  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password) {
    console.log(
      '! No admin account yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env, ' +
        'then run npm run db:setup again (or create one from the Users page later).'
    );
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await query(
    `insert into public.admin_users (email, password_hash, name, role)
     values ($1, $2, $3, 'owner')
     on conflict (email) do nothing`,
    [email, hash, process.env.ADMIN_NAME || 'Owner']
  );
  console.log(`✓ owner account created: ${email}`);
}

async function seed() {
  await withTransaction(async (client) => {
    // Content tables are rebuilt on every seed run. Bookings and contact
    // messages are intentionally left untouched, so tours/pickups/site
    // settings are upserted instead of truncated (bookings reference them).
    await client.query(`
      truncate table
        public.quiz_questions,
        public.faqs,
        public.policies,
        public.articles,
        public.gallery,
        public.guides,
        public.reviews
      restart identity
    `);

    await client.query(
      `insert into public.site_settings
        (id, name, url, phone, phone_href, email, address, hours, instagram, facebook, whatsapp, currency)
       values (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (id) do update set
         name = excluded.name,
         url = excluded.url,
         phone = excluded.phone,
         phone_href = excluded.phone_href,
         email = excluded.email,
         address = excluded.address,
         hours = excluded.hours,
         instagram = excluded.instagram,
         facebook = excluded.facebook,
         whatsapp = excluded.whatsapp,
         currency = excluded.currency,
         updated_at = now()`,
      [
        SITE.name,
        SITE.url,
        SITE.phone,
        '6281339578001',
        SITE.email,
        'Pupuan, Tabanan, North Bali',
        '07:00–20:00 WITA, every day',
        'https://instagram.com/canyoningbali',
        'https://facebook.com/canyoningbali',
        'https://wa.me/6281339578001',
        SITE.currency || 'IDR',
      ]
    );

    for (const [index, tour] of TOURS.entries()) {
      await client.query(
        `insert into public.tours (
          id, name, short, level, level_key, badge, badge_class, duration,
          min_age, max_weight, swim, jumps, slides, group_size, price, image,
          gallery_ids, best_for, long_description, itinerary, inclusions,
          exclusions, requirements, bring, meeting, cancellation, sort_order
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
          $20::jsonb,$21,$22,$23,$24,$25,$26,$27
        )
        on conflict (id) do update set
          name = excluded.name,
          short = excluded.short,
          level = excluded.level,
          level_key = excluded.level_key,
          badge = excluded.badge,
          badge_class = excluded.badge_class,
          duration = excluded.duration,
          min_age = excluded.min_age,
          max_weight = excluded.max_weight,
          swim = excluded.swim,
          jumps = excluded.jumps,
          slides = excluded.slides,
          group_size = excluded.group_size,
          price = excluded.price,
          image = excluded.image,
          gallery_ids = excluded.gallery_ids,
          best_for = excluded.best_for,
          long_description = excluded.long_description,
          itinerary = excluded.itinerary,
          inclusions = excluded.inclusions,
          exclusions = excluded.exclusions,
          requirements = excluded.requirements,
          bring = excluded.bring,
          meeting = excluded.meeting,
          cancellation = excluded.cancellation,
          sort_order = excluded.sort_order,
          active = true,
          updated_at = now()`,
        [
          tour.id,
          tour.name,
          tour.short,
          tour.level,
          tour.levelKey,
          tour.badge,
          tour.badgeClass,
          tour.duration,
          tour.minAge,
          tour.maxWeight,
          tour.swim,
          tour.jumps,
          tour.slides,
          tour.group,
          tour.price,
          tour.image,
          tour.galleryIds,
          tour.bestFor,
          tour.long,
          JSON.stringify(tour.itinerary || []),
          tour.inclusions,
          tour.exclusions,
          tour.requirements,
          tour.bring,
          tour.meeting,
          tour.cancellation,
          index,
        ]
      );
    }

    for (const [index, pickup] of PICKUP.entries()) {
      await client.query(
        `insert into public.pickups (id, label, fee, sort_order) values ($1,$2,$3,$4)
         on conflict (id) do update set
           label = excluded.label,
           fee = excluded.fee,
           sort_order = excluded.sort_order,
           active = true`,
        [pickup.id, pickup.label, pickup.fee, index]
      );
    }

    for (const [index, review] of REVIEWS.entries()) {
      await client.query(
        `insert into public.reviews
          (name, country, date_label, tour, rating, source, initials, color, quote, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          review.name,
          review.country,
          review.date,
          review.tour,
          review.rating,
          review.source,
          review.initials,
          review.color,
          review.quote,
          index,
        ]
      );
    }

    for (const [index, guide] of GUIDES.entries()) {
      await client.query(
        `insert into public.guides (name, role, years, bio, languages, initials, color, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [guide.name, guide.role, guide.years, guide.bio, guide.languages, guide.initials, guide.color, index]
      );
    }

    for (const [index, image] of GALLERY.entries()) {
      await client.query(
        `insert into public.gallery (id, caption, alt, sort_order) values ($1,$2,$3,$4)`,
        [image.id, image.caption, image.alt, index]
      );
    }

    for (const [index, [slug, article]] of Object.entries(ARTICLES).entries()) {
      await client.query(
        `insert into public.articles (slug, kicker, title, meta, image_id, body, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [slug, article.kicker, article.title, article.meta, article.imageId, article.body, index]
      );
    }

    for (const [index, faq] of FAQ.entries()) {
      await client.query(
        `insert into public.faqs (question, answer, sort_order) values ($1,$2,$3)`,
        [faq.q, faq.a, index]
      );
    }

    for (const [slug, policy] of Object.entries(POLICIES)) {
      await client.query(
        `insert into public.policies (slug, title, html) values ($1,$2,$3)`,
        [slug, policy.title, policy.html]
      );
    }

    for (const [index, question] of QUIZ.entries()) {
      await client.query(
        `insert into public.quiz_questions (key, question, options, sort_order)
         values ($1,$2,$3::jsonb,$4)`,
        [question.key, question.q, JSON.stringify(question.options), index]
      );
    }
  });

  console.log(`✓ seeded ${TOURS.length} tours, ${REVIEWS.length} reviews, ${Object.keys(ARTICLES).length} articles`);
}

const forceSeed = process.argv.includes('--force');

try {
  await applySchema();
  await migrate();

  const { rows } = await query('select count(*)::int as count from public.tours');
  if (rows[0].count === 0 || forceSeed) {
    await seed();
  } else {
    console.log(
      '✓ content already present — seed skipped (existing admin edits are preserved). ' +
        'Run "npm --prefix server run db:seed -- --force" to reset content.'
    );
  }

  await seedFirstAdmin();
  console.log('✓ database ready');
} catch (error) {
  console.error('Database setup failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}