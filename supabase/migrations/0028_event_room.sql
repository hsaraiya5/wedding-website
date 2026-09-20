-- The itinerary flip-card's "Room" fact has been a hardcoded "Coming
-- soon" placeholder since it shipped -- give admins a real column to
-- fill in once room assignments are confirmed with the venue.

alter table events
  add column room text;

drop function if exists public.admin_upsert_event(
  uuid, text, date, time, time, text, text, text, text, text, jsonb
);

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
  p_room text,
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
        room = p_room,
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
  uuid, text, date, time, time, text, text, text, text, text, text, jsonb
) to authenticated;
