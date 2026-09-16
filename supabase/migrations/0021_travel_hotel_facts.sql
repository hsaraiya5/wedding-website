-- v2 handoff Travel & Stay restructure: each hotel card now shows an
-- eyebrow label ("Venue hotel"/"Shuttle hotel"), a room block description,
-- and an address, instead of a booking code/nightly rate/reserve-by date
-- (that facts list didn't match the final design). booking_code and
-- rate_cutoff_date are dropped -- nothing else reads them, and nothing has
-- shipped to real guests yet. nightly_rate is repurposed (renamed) as the
-- more general "booking details" fact, since "Coming soon" placeholder
-- copy is what actually gets shown there until a real link exists.
--
-- The shuttle-note card is no longer admin-content-backed (its copy is
-- fixed site chrome that also swaps for hosted-stay households, same as
-- other static chrome text elsewhere in the app) -- so the 'transport'
-- travel_options type is no longer rendered by the guest site. Existing
-- transport rows are left in place (harmless, admin can delete via the
-- existing UI) rather than force-migrating/deleting data.

alter table travel_options
  add column label text,
  add column room_block text,
  add column address text;

alter table travel_options rename column nightly_rate to booking_details;

alter table travel_options
  drop column booking_code,
  drop column rate_cutoff_date;

create or replace function public.admin_upsert_travel_option(
  p_travel_option_id uuid,
  p_type text,
  p_name text,
  p_label text,
  p_description text,
  p_room_block text,
  p_address text,
  p_booking_details text,
  p_booking_link text
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
    insert into travel_options (type, name, label, description, room_block, address, booking_details, booking_link)
    values (p_type, p_name, p_label, p_description, p_room_block, p_address, p_booking_details, p_booking_link)
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
          booking_link = p_booking_link
      where id = p_travel_option_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'travel_option_update', p_travel_option_id::text,
            jsonb_build_object('name', p_name, 'type', p_type));

    v_id := p_travel_option_id;
  end if;

  return v_id;
end;
$$;

drop function if exists public.admin_upsert_travel_option(uuid, text, text, text, text, text, date, text);

grant execute on function public.admin_upsert_travel_option(
  uuid, text, text, text, text, text, text, text, text
) to authenticated;
