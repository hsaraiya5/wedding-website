-- Helper functions, RPCs, and Row Level Security policies.
-- All authorization lives here rather than in application code (see Decision
-- Log, "Tech Stack" and "API Layer" entries).

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- True if the calling session belongs to an admin (their OAuth email is on
-- the admins allowlist). SECURITY DEFINER so it can read the admins table
-- regardless of the caller's own row-level permissions.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admins a where a.email = (auth.jwt() ->> 'email')
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- The household_id the calling session is currently allowed to act as, or
-- null if there isn't one. Requires the session's code_version to still
-- match the household's current code_version -- this is what makes
-- regenerating/changing a code instantly invalidate old sessions.
create or replace function public.session_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hs.household_id
  from household_sessions hs
  join households h on h.id = hs.household_id
  where hs.auth_uid = auth.uid()
    and hs.code_version = h.code_version;
$$;

grant execute on function public.session_household_id() to authenticated, anon;

-- ---------------------------------------------------------------------------
-- redeem_invite_code: the only way a guest session gets linked to a
-- household. Called after the client establishes an anonymous auth session.
-- ---------------------------------------------------------------------------

create or replace function public.redeem_invite_code(p_code text)
returns table (household_id uuid, household_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household households%rowtype;
begin
  select * into v_household from households where lower(code) = lower(p_code);

  if not found then
    raise exception 'invalid_code';
  end if;

  insert into household_sessions (auth_uid, household_id, code_version)
  values (auth.uid(), v_household.id, v_household.code_version)
  on conflict (auth_uid) do update
    set household_id = excluded.household_id,
        code_version = excluded.code_version;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('guest', auth.uid()::text, 'code_entry', v_household.id::text,
          jsonb_build_object('code', p_code));

  return query select v_household.id, v_household.display_name;
end;
$$;

grant execute on function public.redeem_invite_code(text) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table households enable row level security;
alter table guests enable row level security;
alter table household_sessions enable row level security;
alter table events enable row level security;
alter table household_events enable row level security;
alter table rsvps enable row level security;
alter table content_blocks enable row level security;
alter table faqs enable row level security;
alter table travel_options enable row level security;
alter table site_settings enable row level security;
alter table admins enable row level security;
alter table audit_log enable row level security;

-- households
create policy "admin full access to households" on households
  for all using (is_admin()) with check (is_admin());
create policy "guest can read own household" on households
  for select using (id = session_household_id());

-- guests
create policy "admin full access to guests" on guests
  for all using (is_admin()) with check (is_admin());
create policy "guest can read own household members" on guests
  for select using (household_id = session_household_id());

-- household_sessions: no direct guest access -- only written via
-- redeem_invite_code (SECURITY DEFINER). Admins can read for debugging.
create policy "admin can read household_sessions" on household_sessions
  for select using (is_admin());

-- events
create policy "admin full access to events" on events
  for all using (is_admin()) with check (is_admin());
create policy "guest can read invited events" on events
  for select using (
    exists (
      select 1 from household_events he
      where he.event_id = events.id
        and he.household_id = session_household_id()
    )
  );

-- household_events
create policy "admin full access to household_events" on household_events
  for all using (is_admin()) with check (is_admin());
create policy "guest can read own invitations" on household_events
  for select using (household_id = session_household_id());

-- rsvps (writes go through RPCs once built -- read-only policies for now)
create policy "admin full access to rsvps" on rsvps
  for all using (is_admin()) with check (is_admin());
create policy "guest can read own household rsvps" on rsvps
  for select using (
    guest_id in (select id from guests where household_id = session_household_id())
  );

-- content_blocks / faqs / travel_options / site_settings: admin-editable,
-- readable by any authenticated guest session (matches "full site access
-- regardless of RSVP status") or an admin.
create policy "admin full access to content_blocks" on content_blocks
  for all using (is_admin()) with check (is_admin());
create policy "guest can read content_blocks" on content_blocks
  for select using (session_household_id() is not null);

create policy "admin full access to faqs" on faqs
  for all using (is_admin()) with check (is_admin());
create policy "guest can read faqs" on faqs
  for select using (session_household_id() is not null);

create policy "admin full access to travel_options" on travel_options
  for all using (is_admin()) with check (is_admin());
create policy "guest can read travel_options" on travel_options
  for select using (session_household_id() is not null);

create policy "admin full access to site_settings" on site_settings
  for all using (is_admin()) with check (is_admin());
create policy "guest can read site_settings" on site_settings
  for select using (session_household_id() is not null);

-- admins: admin-only read. Managed via the Supabase dashboard, not the app.
create policy "admin can read admins" on admins
  for select using (is_admin());

-- audit_log: admin-only read. Rows are written by SECURITY DEFINER
-- functions, so no insert policy is needed for guests or admins.
create policy "admin can read audit_log" on audit_log
  for select using (is_admin());
