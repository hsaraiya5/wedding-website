-- Travel & Stay redesign: hotel cards become flip cards (like the
-- itinerary cards), so the fact set expands to cover what fits on a
-- front/back split -- room types + booking + map on the front, parking/
-- distance/check-in-out on the back. room_block is renamed to room_types
-- since "types of rooms available" (e.g. "King or Double Queen") is what
-- it's actually used for. booking_details is dropped -- it was a single
-- freeform "Coming soon" fact that's now superseded by the more specific
-- new fields.

alter table travel_options rename column room_block to room_types;

alter table travel_options
  add column map_link text,
  add column parking_info text,
  add column distance_from_venue text,
  add column checkin_time text,
  add column checkout_time text;

alter table travel_options drop column booking_details;

create or replace function public.admin_upsert_travel_option(
  p_travel_option_id uuid,
  p_type text,
  p_name text,
  p_label text,
  p_description text,
  p_room_types text,
  p_address text,
  p_map_link text,
  p_booking_link text,
  p_parking_info text,
  p_distance_from_venue text,
  p_checkin_time text,
  p_checkout_time text,
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
    insert into travel_options (
      type, name, label, description, room_types, address, map_link, booking_link,
      parking_info, distance_from_venue, checkin_time, checkout_time, sort_order
    )
    values (
      p_type, p_name, p_label, p_description, p_room_types, p_address, p_map_link, p_booking_link,
      p_parking_info, p_distance_from_venue, p_checkin_time, p_checkout_time, coalesce(p_sort_order, 0)
    )
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
          room_types = p_room_types,
          address = p_address,
          map_link = p_map_link,
          booking_link = p_booking_link,
          parking_info = p_parking_info,
          distance_from_venue = p_distance_from_venue,
          checkin_time = p_checkin_time,
          checkout_time = p_checkout_time,
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

drop function if exists public.admin_upsert_travel_option(
  uuid, text, text, text, text, text, text, text, text, int
);

grant execute on function public.admin_upsert_travel_option(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, int
) to authenticated;
