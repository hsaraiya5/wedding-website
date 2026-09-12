-- Moves event invitations from household-level to guest-level: not every
-- guest in a household is necessarily invited to every event the household
-- has access to (e.g. kids skipping a late-night event). Replaces
-- household_events with guest_events everywhere it was used.

create table guest_events (
  guest_id uuid not null references guests (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  primary key (guest_id, event_id)
);

alter table guest_events enable row level security;

-- Best-effort data migration: whatever a household was invited to under the
-- old model, every current guest in that household inherits under the new
-- one. Existing test/real data isn't lost, just re-shaped.
insert into guest_events (guest_id, event_id)
select g.id, he.event_id
from household_events he
join guests g on g.household_id = he.household_id
on conflict do nothing;

-- Admin full access + guest can read their own household's guest_events.
create policy "admin full access to guest_events" on guest_events
  for all using (is_admin()) with check (is_admin());
create policy "guest can read own household guest_events" on guest_events
  for select using (
    guest_id in (select id from guests where household_id = session_household_id())
  );

drop policy "guest can read invited events" on events;
create policy "guest can read invited events" on events
  for select using (
    exists (
      select 1 from guest_events ge
      join guests g on g.id = ge.guest_id
      where ge.event_id = events.id
        and g.household_id = session_household_id()
    )
  );

drop policy "admin full access to household_events" on household_events;
drop policy "guest can read own invitations" on household_events;
drop table household_events;

drop function if exists public.admin_set_household_events(uuid, uuid[]);

create or replace function public.admin_set_guest_events(
  p_guest_id uuid,
  p_event_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  delete from guest_events where guest_id = p_guest_id;

  insert into guest_events (guest_id, event_id)
  select p_guest_id, unnest(p_event_ids);

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'invitations_update', p_guest_id::text,
          jsonb_build_object('event_ids', p_event_ids));
end;
$$;

grant execute on function public.admin_set_guest_events(uuid, uuid[]) to authenticated;

-- get_guest_context: "events" becomes the union of events any guest in the
-- household is invited to (still useful for a household-level overview on
-- /events); "guest_events" is added so the RSVP form knows exactly which
-- guest x event combinations to render.
create or replace function public.get_guest_context()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_result jsonb;
begin
  v_household_id := session_household_id();
  if v_household_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'household', (select to_jsonb(h) from households h where h.id = v_household_id),
    'guests', (
      select coalesce(jsonb_agg(g order by g.first_name), '[]'::jsonb)
      from guests g where g.household_id = v_household_id
    ),
    'events', (
      select coalesce(jsonb_agg(distinct to_jsonb(e)), '[]'::jsonb)
      from events e
      join guest_events ge on ge.event_id = e.id
      join guests g on g.id = ge.guest_id
      where g.household_id = v_household_id
    ),
    'guest_events', (
      select coalesce(jsonb_agg(jsonb_build_object('guest_id', ge.guest_id, 'event_id', ge.event_id)), '[]'::jsonb)
      from guest_events ge
      join guests g on g.id = ge.guest_id
      where g.household_id = v_household_id
    ),
    'rsvps', (
      select coalesce(jsonb_agg(r), '[]'::jsonb)
      from rsvps r
      join guests g on g.id = r.guest_id
      where g.household_id = v_household_id
    ),
    'site_settings', (select to_jsonb(s) from site_settings s where s.id = true)
  ) into v_result;

  return v_result;
end;
$$;

-- submit_rsvp: validate against guest_events (per guest) instead of
-- household_events (per household).
create or replace function public.submit_rsvp(p_answers jsonb, p_song_request text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_deadline timestamptz;
  v_late_edits_enabled boolean;
  v_is_new boolean;
  v_answer jsonb;
  v_guest_id uuid;
  v_event_id uuid;
  v_attending text;
begin
  v_household_id := session_household_id();
  if v_household_id is null then
    raise exception 'no_active_session';
  end if;

  select rsvp_deadline, late_edits_enabled
    into v_deadline, v_late_edits_enabled
    from site_settings where id = true;

  if v_deadline is not null and now() > v_deadline and not v_late_edits_enabled then
    raise exception 'rsvp_closed';
  end if;

  select rsvp_submitted_at is null into v_is_new from households where id = v_household_id;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    v_guest_id := (v_answer ->> 'guest_id')::uuid;
    v_event_id := (v_answer ->> 'event_id')::uuid;
    v_attending := v_answer ->> 'attending';

    if v_attending not in ('yes', 'no') then
      raise exception 'invalid_attending_value';
    end if;

    if not exists (
      select 1 from guests where id = v_guest_id and household_id = v_household_id
    ) then
      raise exception 'guest_not_in_household';
    end if;

    if not exists (
      select 1 from guest_events where guest_id = v_guest_id and event_id = v_event_id
    ) then
      raise exception 'event_not_invited';
    end if;

    insert into rsvps (guest_id, event_id, attending, responded_at)
    values (v_guest_id, v_event_id, v_attending, now())
    on conflict (guest_id, event_id) do update
      set attending = excluded.attending,
          responded_at = now(),
          edited_by_admin = null;
  end loop;

  update households
    set rsvp_submitted_at = now(),
        song_request = coalesce(p_song_request, song_request)
    where id = v_household_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values (
    'guest',
    auth.uid()::text,
    case when v_is_new then 'rsvp_submit' else 'rsvp_edit' end,
    v_household_id::text,
    jsonb_build_object('answers', p_answers, 'song_request', p_song_request)
  );
end;
$$;
