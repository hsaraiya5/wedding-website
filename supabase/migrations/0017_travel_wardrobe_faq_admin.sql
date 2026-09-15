-- Admin CRUD for the three remaining design-handoff sections that had no
-- backing UI yet: Travel & stay, Wardrobe planner, and FAQ. Wardrobe reuses
-- events.extra_content (see the 2026-09-12 "design integration plan" entry
-- in the Decision Log) rather than a new table, so this also finally closes
-- the surfaced US-A6 gap: admin event editing didn't exist at all before
-- this migration.

-- admin_upsert_event: editing only, not create/delete -- the event list
-- (Haldi/Sangeet/Ceremony/Reception) is fixed for this wedding, so US-A6
-- only ever required editing existing events without a code deploy.
-- p_extra_content is merged into the existing JSON (top-level keys
-- overwritten, others left alone) rather than replacing it outright, since
-- future non-wardrobe uses of extra_content shouldn't get clobbered by
-- this form.
create or replace function public.admin_upsert_event(
  p_event_id uuid,
  p_name text,
  p_event_date date,
  p_start_time time,
  p_end_time time,
  p_venue_name text,
  p_address text,
  p_dress_code text,
  p_meal_info text,
  p_description text,
  p_extra_content jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if not exists (select 1 from events where id = p_event_id) then
    raise exception 'event_not_found';
  end if;

  update events
    set name = p_name,
        event_date = p_event_date,
        start_time = p_start_time,
        end_time = p_end_time,
        venue_name = p_venue_name,
        address = p_address,
        dress_code = p_dress_code,
        meal_info = p_meal_info,
        description = p_description,
        extra_content = coalesce(extra_content, '{}'::jsonb) || coalesce(p_extra_content, '{}'::jsonb)
    where id = p_event_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'event_update', p_event_id::text,
          jsonb_build_object('name', p_name, 'event_date', p_event_date));

  return p_event_id;
end;
$$;

grant execute on function public.admin_upsert_event(
  uuid, text, date, time, time, text, text, text, text, text, jsonb
) to authenticated;

-- Travel options (hotel blocks, other hotels, transport notes).
create or replace function public.admin_upsert_travel_option(
  p_travel_option_id uuid,
  p_type text,
  p_name text,
  p_booking_code text,
  p_booking_link text,
  p_nightly_rate text,
  p_rate_cutoff_date date,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_travel_option_id is null then
    insert into travel_options (type, name, booking_code, booking_link, nightly_rate, rate_cutoff_date, description)
    values (p_type, p_name, p_booking_code, p_booking_link, p_nightly_rate, p_rate_cutoff_date, p_description)
    returning id into v_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'travel_option_create', v_id::text,
            jsonb_build_object('name', p_name, 'type', p_type));
  else
    update travel_options
      set type = p_type,
          name = p_name,
          booking_code = p_booking_code,
          booking_link = p_booking_link,
          nightly_rate = p_nightly_rate,
          rate_cutoff_date = p_rate_cutoff_date,
          description = p_description
      where id = p_travel_option_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'travel_option_update', p_travel_option_id::text,
            jsonb_build_object('name', p_name, 'type', p_type));

    v_id := p_travel_option_id;
  end if;

  return v_id;
end;
$$;

grant execute on function public.admin_upsert_travel_option(
  uuid, text, text, text, text, text, date, text
) to authenticated;

create or replace function public.admin_delete_travel_option(p_travel_option_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  delete from travel_options where id = p_travel_option_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'travel_option_delete', p_travel_option_id::text, '{}'::jsonb);
end;
$$;

grant execute on function public.admin_delete_travel_option(uuid) to authenticated;

-- FAQs.
create or replace function public.admin_upsert_faq(
  p_faq_id uuid,
  p_question text,
  p_answer text,
  p_order_index int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_faq_id is null then
    insert into faqs (question, answer, order_index)
    values (p_question, p_answer, p_order_index)
    returning id into v_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'faq_create', v_id::text,
            jsonb_build_object('question', p_question));
  else
    update faqs
      set question = p_question, answer = p_answer, order_index = p_order_index
      where id = p_faq_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'faq_update', p_faq_id::text,
            jsonb_build_object('question', p_question));

    v_id := p_faq_id;
  end if;

  return v_id;
end;
$$;

grant execute on function public.admin_upsert_faq(uuid, text, text, int) to authenticated;

create or replace function public.admin_delete_faq(p_faq_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  delete from faqs where id = p_faq_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'faq_delete', p_faq_id::text, '{}'::jsonb);
end;
$$;

grant execute on function public.admin_delete_faq(uuid) to authenticated;

-- get_guest_context: add travel_options and faqs, both global content (not
-- household-scoped, unlike everything else this function returns) -- fine
-- to expose to any authenticated guest session the same way events/
-- site_settings are already treated as "public once you're past the invite
-- code". Otherwise unchanged from 0015_fix_event_ordering.sql (keeps that
-- migration's dedupe-then-order fix for the events array).
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
      select coalesce(jsonb_agg(sub order by sub.event_date, sub.start_time), '[]'::jsonb)
      from (
        select distinct e.*
        from events e
        join guest_events ge on ge.event_id = e.id
        join guests g on g.id = ge.guest_id
        where g.household_id = v_household_id
      ) sub
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
    'site_settings', (select to_jsonb(s) from site_settings s where s.id = true),
    'travel_options', (
      select coalesce(jsonb_agg(t order by t.type, t.name), '[]'::jsonb) from travel_options t
    ),
    'faqs', (
      select coalesce(jsonb_agg(f order by f.order_index), '[]'::jsonb) from faqs f
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_guest_context() to authenticated, anon;
