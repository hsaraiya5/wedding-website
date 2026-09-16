-- Hotel cards were sorting alphabetically by name, which meant an
-- unrelated placeholder row landed alphabetically between the two real
-- hotels and split them across rows in the 2-column grid instead of
-- keeping them adjacent. Admin-controlled sort_order (same pattern as
-- faqs.order_index) fixes that regardless of naming or how many hotel
-- rows exist.

alter table travel_options add column sort_order int not null default 0;

create or replace function public.admin_upsert_travel_option(
  p_travel_option_id uuid,
  p_type text,
  p_name text,
  p_label text,
  p_description text,
  p_room_block text,
  p_address text,
  p_booking_details text,
  p_booking_link text,
  p_sort_order int
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
    insert into travel_options (type, name, label, description, room_block, address, booking_details, booking_link, sort_order)
    values (p_type, p_name, p_label, p_description, p_room_block, p_address, p_booking_details, p_booking_link, coalesce(p_sort_order, 0))
    returning id into v_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'travel_option_create', v_id::text,
            jsonb_build_object('name', p_name, 'type', p_type));
  else
    update travel_options
      set type = p_type,
          name = p_name,
          label = p_label,
          description = p_description,
          room_block = p_room_block,
          address = p_address,
          booking_details = p_booking_details,
          booking_link = p_booking_link,
          sort_order = coalesce(p_sort_order, 0)
      where id = p_travel_option_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'travel_option_update', p_travel_option_id::text,
            jsonb_build_object('name', p_name, 'type', p_type));

    v_id := p_travel_option_id;
  end if;

  return v_id;
end;
$$;

drop function if exists public.admin_upsert_travel_option(uuid, text, text, text, text, text, text, text);

grant execute on function public.admin_upsert_travel_option(
  uuid, text, text, text, text, text, text, text, text, int
) to authenticated;

-- Reorders get_guest_context's travel_options by the new sort_order
-- (falling back to name) instead of type/name. Otherwise identical to
-- the 0017 definition.
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
    'household', (
      select to_jsonb(h) || jsonb_build_object('rsvp_deadline', rd.deadline)
      from households h
      join rsvp_deadlines rd on rd.id = h.rsvp_deadline_id
      where h.id = v_household_id
    ),
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
      select coalesce(jsonb_agg(t order by t.sort_order, t.name), '[]'::jsonb) from travel_options t
    ),
    'faqs', (
      select coalesce(jsonb_agg(f order by f.order_index), '[]'::jsonb) from faqs f
    ),
    'whatsapp_numbers', (
      select coalesce(jsonb_agg(w order by w.created_at), '[]'::jsonb)
      from household_whatsapp_numbers w
      where w.household_id = v_household_id
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_guest_context() to authenticated, anon;
