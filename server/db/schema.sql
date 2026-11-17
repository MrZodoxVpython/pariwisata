-- Canyoning Bali — Supabase / PostgreSQL schema
-- Run with: npm run db:setup

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------------

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null,
  url text not null,
  phone text not null,
  phone_href text not null,
  email text not null,
  address text not null,
  hours text not null,
  instagram text,
  facebook text,
  whatsapp text,
  currency text not null default 'IDR',
  updated_at timestamptz not null default now()
);

create table if not exists public.tours (
  id text primary key,
  name text not null,
  short text not null,
  level text not null,
  level_key text not null,
  badge text,
  badge_class text,
  duration text not null,
  min_age integer not null default 8,
  max_weight integer not null default 120,
  swim text not null,
  jumps text,
  slides text,
  group_size text not null default 'Max 8 guests',
  price bigint not null check (price >= 0),
  image text not null,
  gallery_ids text[] not null default '{}',
  best_for text,
  long_description text,
  itinerary jsonb not null default '[]'::jsonb,
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  requirements text[] not null default '{}',
  bring text[] not null default '{}',
  meeting text,
  cancellation text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pickups (
  id text primary key,
  label text not null,
  fee bigint not null default 0 check (fee >= 0),
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.reviews (
  id bigserial primary key,
  name text not null,
  country text not null,
  date_label text not null,
  tour text not null,
  rating integer not null check (rating between 1 and 5),
  source text,
  initials text,
  color text,
  quote text not null,
  sort_order integer not null default 0,
  published boolean not null default true
);

create table if not exists public.guides (
  id bigserial primary key,
  name text not null,
  role text not null,
  years text,
  bio text,
  languages text,
  initials text,
  color text,
  sort_order integer not null default 0
);

create table if not exists public.gallery (
  id text primary key,
  caption text,
  alt text,
  sort_order integer not null default 0
);

create table if not exists public.articles (
  slug text primary key,
  kicker text,
  title text not null,
  meta text,
  image_id text,
  body text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id bigserial primary key,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  published boolean not null default true
);

create table if not exists public.policies (
  slug text primary key,
  title text not null,
  html text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id bigserial primary key,
  key text not null unique,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Transaction tables
-- ---------------------------------------------------------------------------

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  tour_id text references public.tours(id),
  tour_name text not null,
  date date not null,
  people integer not null check (people between 1 and 8),
  pickup_id text references public.pickups(id),
  pickup_name text,
  pickup_fee bigint not null default 0,
  subtotal bigint not null default 0,
  total bigint not null default 0,
  name text not null,
  email text,
  whatsapp text not null,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_requests_created_at_idx
  on public.booking_requests (created_at desc);
create index if not exists booking_requests_status_idx
  on public.booking_requests (status);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  whatsapp text not null,
  preferred_date date,
  people integer check (people between 1 and 8),
  tour_id text,
  message text,
  status text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- Supabase hardening
-- The API server connects with the postgres role (direct/pooler connection).
-- No table needs to be exposed through the public anon/authenticated roles.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'site_settings', 'tours', 'pickups', 'reviews', 'guides', 'gallery',
    'articles', 'faqs', 'policies', 'quiz_questions', 'booking_requests',
    'contact_messages'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

revoke all on all sequences in schema public from anon, authenticated;