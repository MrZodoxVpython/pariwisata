-- Canyoning Bali — admin panel migration (idempotent)
-- Run with: npm run db:migrate

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin accounts & audit trail
-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  active boolean not null default true,
  token_version integer not null default 0,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid references public.admin_users(id) on delete set null,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  diff jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity, created_at desc);

-- ---------------------------------------------------------------------------
-- Availability & booking workflow
-- ---------------------------------------------------------------------------

create table if not exists public.tour_availability (
  id bigserial primary key,
  tour_id text not null references public.tours(id) on delete cascade,
  date date not null,
  capacity integer not null check (capacity between 0 and 50),
  is_closed boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour_id, date)
);

create index if not exists tour_availability_date_idx on public.tour_availability (date);

create table if not exists public.booking_status_history (
  id bigserial primary key,
  booking_id uuid not null references public.booking_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.admin_users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists booking_status_history_booking_idx
  on public.booking_status_history (booking_id, created_at desc);

create table if not exists public.booking_notes (
  id bigserial primary key,
  booking_id uuid not null references public.booking_requests(id) on delete cascade,
  author_id uuid references public.admin_users(id) on delete set null,
  author_email text,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_notes_booking_idx
  on public.booking_notes (booking_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Media library & notification outbox
-- ---------------------------------------------------------------------------

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  url text not null,
  mime text,
  size_bytes bigint,
  width integer,
  height integer,
  alt text,
  caption text,
  uploaded_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id bigserial primary key,
  channel text not null check (channel in ('email', 'whatsapp')),
  recipient text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notifications_status_idx on public.notifications (status, created_at);

-- ---------------------------------------------------------------------------
-- Existing tables: additive columns
-- ---------------------------------------------------------------------------

alter table public.tours
  add column if not exists daily_capacity integer not null default 8,
  add column if not exists updated_by uuid references public.admin_users(id) on delete set null;

alter table public.booking_requests
  add column if not exists guide_id bigint references public.guides(id) on delete set null,
  add column if not exists source text not null default 'web',
  add column if not exists discount bigint not null default 0,
  add column if not exists updated_by uuid references public.admin_users(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'booking_requests_source_check'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_source_check
      check (source in ('web', 'admin', 'whatsapp', 'phone'));
  end if;
end $$;

create index if not exists booking_requests_date_idx on public.booking_requests (date);
create index if not exists booking_requests_tour_date_idx
  on public.booking_requests (tour_id, date);

alter table public.contact_messages
  add column if not exists replied_at timestamptz,
  add column if not exists replied_by uuid references public.admin_users(id) on delete set null,
  add column if not exists admin_notes text;

create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

alter table public.site_settings
  add column if not exists announcement text,
  add column if not exists announcement_active boolean not null default false,
  add column if not exists notify_email text,
  add column if not exists notify_whatsapp text,
  add column if not exists map_url text;

alter table public.articles add column if not exists updated_at timestamptz not null default now();
alter table public.reviews add column if not exists created_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['tours', 'admin_users', 'articles', 'site_settings', 'booking_requests', 'tour_availability']
  loop
    if not exists (
      select 1 from pg_trigger where tgname = format('%s_set_updated_at', t)
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
        format('%s_set_updated_at', t), t
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Supabase hardening for the new tables
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['admin_users', 'audit_logs', 'tour_availability', 'booking_status_history', 'booking_notes', 'media', 'notifications']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

revoke all on all sequences in schema public from anon, authenticated;