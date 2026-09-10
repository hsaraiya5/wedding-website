-- RSVP submission: a single transactional RPC that upserts every guest x
-- event answer in one household's submission, updates the household's
-- rsvp_submitted_at / song_request, and enforces the deadline server-side
-- (not just in the UI). See Decision Log, "API Layer" entry.

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
      select 1 from household_events
      where household_id = v_household_id and event_id = v_event_id
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

grant execute on function public.submit_rsvp(jsonb, text) to authenticated, anon;
