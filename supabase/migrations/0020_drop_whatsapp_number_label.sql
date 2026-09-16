-- Dropping the "whose number" label on household_whatsapp_numbers -- design
-- feedback was that a plain phone number list is enough, no per-number
-- label needed.

alter table household_whatsapp_numbers drop column label;

create or replace function public.submit_rsvp(
  p_answers jsonb,
  p_song_request text default null,
  p_whatsapp_numbers jsonb default null
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
  v_number jsonb;
begin
  v_household_id := session_household_id();
  if v_household_id is null then
    raise exception 'no_active_session';
  end if;

  select rd.deadline into v_deadline
    from households h
    join rsvp_deadlines rd on rd.id = h.rsvp_deadline_id
    where h.id = v_household_id;

  select late_edits_enabled into v_late_edits_enabled from site_settings where id = true;

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

  if p_whatsapp_numbers is not null then
    delete from household_whatsapp_numbers where household_id = v_household_id;

    for v_number in select * from jsonb_array_elements(p_whatsapp_numbers)
    loop
      if coalesce(trim(v_number ->> 'phone_number'), '') <> '' then
        insert into household_whatsapp_numbers (household_id, phone_number)
        values (v_household_id, trim(v_number ->> 'phone_number'));
      end if;
    end loop;
  end if;

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
