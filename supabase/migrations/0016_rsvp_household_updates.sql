-- The design handoff's RSVP form ends with a "Household updates" block:
-- one household email (used for the RSVP receipt) plus an opt-in checkbox
-- for ad-hoc wedding announcements. households.contact_email already
-- existed but was admin-only -- guests had no way to set it, and there was
-- no opt-in flag at all. This adds the flag and lets submit_rsvp write both
-- as part of the same transactional submission.
--
-- See Decision Log, "Ad-hoc email updates opt-in" (previously bookmarked as
-- a post-core idea; the handoff puts it inline in the RSVP flow).

alter table households
  add column if not exists updates_opt_in boolean not null default false;

comment on column households.updates_opt_in is
  'Household opted in to ad-hoc wedding announcement emails (separate from RSVP receipts/nudges).';

-- Replaces the 0007 definition. Same per-guest validation and deadline
-- enforcement; adds contact email + opt-in write-through.
create or replace function public.submit_rsvp(
  p_answers jsonb,
  p_song_request text default null,
  p_contact_email text default null,
  p_updates_opt_in boolean default null
)
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

  if p_contact_email is not null and p_contact_email <> ''
     and p_contact_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_contact_email';
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
        song_request = coalesce(p_song_request, song_request),
        contact_email = coalesce(nullif(p_contact_email, ''), contact_email),
        updates_opt_in = coalesce(p_updates_opt_in, updates_opt_in)
    where id = v_household_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values (
    'guest',
    auth.uid()::text,
    case when v_is_new then 'rsvp_submit' else 'rsvp_edit' end,
    v_household_id::text,
    jsonb_build_object(
      'answers', p_answers,
      'song_request', p_song_request,
      'updates_opt_in', p_updates_opt_in
    )
  );
end;
$$;

-- Drop the superseded 2-arg overload so callers can't accidentally bind to
-- a version that silently ignores the new fields.
drop function if exists public.submit_rsvp(jsonb, text);

grant execute on function public.submit_rsvp(jsonb, text, text, boolean) to authenticated, anon;
