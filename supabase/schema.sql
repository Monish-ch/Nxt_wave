-- ============================================================================
-- NxtWave AI Workshop Growth Engine — Supabase / PostgreSQL schema
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (or `psql`) when deploying against
-- Supabase. It mirrors prisma/schema.prisma 1:1. When using Prisma against
-- Supabase you can instead just point DATABASE_URL at Postgres and run
-- `prisma db push` — this file exists for teams that prefer raw SQL/migrations.
-- ============================================================================

-- ---------------------------------------------------------------- registrations
create table if not exists "registrations" (
  "id"              uuid primary key default gen_random_uuid(),
  "full_name"       text not null,
  "email"           text not null unique,
  "whatsapp"        text,
  "college"         text,
  "branch"          text,
  "graduation_year" integer,
  "source"          text,                -- ambassador | club | whatsapp | referral | instagram | other
  "source_code"     text,                -- e.g. RAHUL01, CSECLUB01, UTM code
  "share_variant"   text,                -- A/B invite style that landed this signup: friendly | achievement | urgent
  "referral_code"   text not null unique,-- the student's own shareable code (NXW-XXXXNN)
  "referred_by"     uuid references "registrations"("id") on delete set null,
  "snoozed_until"   timestamp(3),        -- nudge outreach hygiene: skip bulk pushes until this passes
  "created_at"      timestamp(3) not null default now()
);

create index if not exists "registrations_created_at_idx" on "registrations"("created_at");
create index if not exists "registrations_source_idx"     on "registrations"("source");
create index if not exists "registrations_college_idx"    on "registrations"("college");
create index if not exists "registrations_referred_by_idx" on "registrations"("referred_by");
create index if not exists "registrations_share_variant_idx" on "registrations"("share_variant");

-- -------------------------------------------------------------------- referrals
create table if not exists "referrals" (
  "id"           uuid primary key default gen_random_uuid(),
  "referrer_id"  uuid not null references "registrations"("id") on delete cascade,
  "referred_id"  uuid not null unique references "registrations"("id") on delete cascade,
  "referral_code" text not null,        -- the code that was used (denormalized for reporting)
  "status"       text not null default 'completed',  -- completed | pending | revoked
  "created_at"   timestamp(3) not null default now()
);

create index if not exists "referrals_referrer_id_idx"   on "referrals"("referrer_id");
create index if not exists "referrals_referral_code_idx" on "referrals"("referral_code");
create index if not exists "referrals_created_at_idx"    on "referrals"("created_at");

-- ------------------------------------------------------------- campaign_sources
create table if not exists "campaign_sources" (
  "id"         uuid primary key default gen_random_uuid(),
  "name"       text not null,
  "code"       text not null unique,
  "type"       text not null,            -- human | community | social | viral | other
  "owner_name" text,
  "created_at" timestamp(3) not null default now()
);

-- ------------------------------------------------------------------- milestones
create table if not exists "milestones" (
  "id"             uuid primary key default gen_random_uuid(),
  "name"           text not null,
  "referral_count" integer not null unique,
  "reward_text"    text not null
);

-- ------------------------------------------------------------------ seed values
insert into "campaign_sources" ("name", "code", "type", "owner_name") values
  ('Campus Ambassador Program',      'ambassador', 'human',     'Growth Team'),
  ('College Club Partnerships',      'club',       'community', 'Outreach Team'),
  ('WhatsApp Community Groups',      'whatsapp',   'community', 'Growth Team'),
  ('Friend / Referral Program',      'referral',   'viral',     'Automated'),
  ('Instagram Reels & Stories',      'instagram',  'social',    'Marketing'),
  ('Other / Organic',                'other',      'other',     null)
on conflict ("code") do nothing;

insert into "milestones" ("name", "referral_count", "reward_text") values
  ('First Share',       1,  'You''re officially part of the growth squad. Welcome!'),
  ('Momentum',          3,  'Bonus AI project resources unlocked.'),
  ('Campus Influencer', 5,  'Growth Contributor certificate + advanced AI toolkit unlocked.'),
  ('Growth Champion',   10, 'Internship fast-track spotlight + 1:1 mentorship session.')
on conflict ("referral_count") do nothing;

-- -------------------------------------------------------------------- digests
-- Audit log for channel-owner digests. One row per digest copy "handed off"
-- (copied send-ready text) to a channel owner — mirrors the nudge audit trail.
create table if not exists "digest_logs" (
  "id"         uuid primary key default gen_random_uuid(),
  "code"       text not null,
  "message"    text,
  "created_at" timestamp(3) not null default now()
);

create index if not exists "digest_logs_code_idx" on "digest_logs"("code");
create index if not exists "digest_logs_created_at_idx" on "digest_logs"("created_at");

-- ---------------------------------------------------------------------- nudges
-- Outreach log for the WhatsApp reminder simulator ("nudge queue" in the
-- Growth Console). One row per reminder sent to a near-miss referrer.
create table if not exists "nudges" (
  "id"             uuid primary key default gen_random_uuid(),
  "registration_id" uuid not null references "registrations"("id") on delete cascade,
  "channel"        text not null default 'whatsapp',
  "message"        text,
  "created_at"     timestamp(3) not null default now()
);

create index if not exists "nudges_registration_id_idx" on "nudges"("registration_id");
create index if not exists "nudges_created_at_idx" on "nudges"("created_at");

-- ------------------------------------------------------------------------
-- Row Level Security: the Next.js server connects with the service role /
-- direct Postgres connection and enforces auth itself (admin cookie +
-- middleware). For Supabase client-side access you would enable RLS and add
-- policies. The anon key should expose nothing:
-- ------------------------------------------------------------------------
-- alter table "registrations"   enable row level security;
-- alter table "referrals"       enable row level security;
-- alter table "campaign_sources" enable row level security;
-- alter table "milestones"      enable row level security;
-- alter table "nudges"          enable row level security;
-- alter table "digest_logs"      enable row level security;
