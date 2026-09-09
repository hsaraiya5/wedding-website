-- Wedding website v0 schema.
-- See the Decision Log (Obsidian, "Coding projects/Wedding Website/Decision Log.md")
-- for the reasoning behind these choices. This is a draft schema, expected to evolve.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Guest list
-- ---------------------------------------------------------------------------

create table households (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  code text not null,
  code_version int not null default 1,
  contact_email text,
  rsvp_submitted_at timestamptz,
  song_request text,
  created_at timestamptz not null default now()
);

create unique index households_code_lower_idx on households (lower(code));

create table guests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  first_name text not null,
  last_name text not null
);

-- Maps a Supabase anonymous auth user to the household their invite code
-- resolved to, plus the code_version that was current at redemption time.
-- Regenerating a household's code bumps code_version, which silently
-- invalidates every session issued under the old code (see redeem_invite_code
-- and the RLS policies below).
create table household_sessions (
  auth_uid uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  code_version int not null
);

-- ---------------------------------------------------------------------------
-- Events & invitations
-- ---------------------------------------------------------------------------

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date,
  start_time time,
  end_time time,
  venue_name text,
  address text,
  dress_code text,
  meal_info text,
  description text,
  extra_content jsonb not null default '{}'::jsonb
);

create table household_events (
  household_id uuid not null references households (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  primary key (household_id, event_id)
);

-- ---------------------------------------------------------------------------
-- RSVPs
-- ---------------------------------------------------------------------------

create table rsvps (
  guest_id uuid not null references guests (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  attending text check (attending in ('yes', 'no')),
  responded_at timestamptz,
  edited_by_admin text,
  primary key (guest_id, event_id)
);

-- ---------------------------------------------------------------------------
-- Admin-editable content
-- ---------------------------------------------------------------------------

create table content_blocks (
  key text primary key,
  value text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  order_index int not null default 0
);

create table travel_options (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('hotel-block', 'other-hotel', 'transport')),
  name text not null,
  booking_code text,
  booking_link text,
  nightly_rate text,
  rate_cutoff_date date,
  description text
);

create table site_settings (
  id boolean primary key default true constraint site_settings_singleton check (id),
  rsvp_deadline timestamptz,
  nudge_1_date timestamptz,
  nudge_2_date timestamptz,
  nudge_3_date timestamptz,
  late_edits_enabled boolean not null default false
);

insert into site_settings (id) values (true);

-- ---------------------------------------------------------------------------
-- Admin & audit
-- ---------------------------------------------------------------------------

-- Allowlist gating who gets admin capability after Google OAuth login.
-- Managed directly via the Supabase dashboard table editor (see Decision Log).
create table admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('guest', 'admin', 'system')),
  actor_id text,
  action text not null,
  target text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
