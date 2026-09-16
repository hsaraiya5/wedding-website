-- 0018 accidentally reverted the guest_events insertion loop that
-- 0011_guest_invitations_on_create.sql had added to admin_upsert_household
-- (copied the wrong prior version as a base). Caught in manual QA: creating
-- a household with guests marked for specific events silently saved them
-- with zero invitations. Restores that loop; everything else matches 0018.

create or replace function public.admin_upsert_household(
  p_household_id uuid,
  p_display_name text,
  p_code text,
  p_rsvp_deadline_id uuid,
  p_hotel_covered_by_host boolean,
  p_guests jsonb default null,
  p_group_tag text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_existing_code text;
  v_code text := p_code;
  v_guest jsonb;
  v_new_guest_id uuid;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_rsvp_deadline_id is null then
    raise exception 'rsvp_deadline_required';
  end if;

  if p_household_id is null then
    if p_guests is null or jsonb_array_length(p_guests) = 0 then
      raise exception 'household_needs_at_least_one_guest';
    end if;

    if v_code is null or length(trim(v_code)) = 0 then
      v_code := generate_unique_household_code();
    end if;

    insert into households (display_name, code, group_tag, rsvp_deadline_id, hotel_covered_by_host)
    values (p_display_name, v_code, p_group_tag, p_rsvp_deadline_id, coalesce(p_hotel_covered_by_host, false))
    returning id into v_household_id;

    for v_guest in select * from jsonb_array_elements(p_guests)
    loop
      insert into guests (household_id, first_name, last_name)
      values (v_household_id, v_guest ->> 'first_name', v_guest ->> 'last_name')
      returning id into v_new_guest_id;

      if v_guest ? 'event_ids' and jsonb_array_length(v_guest -> 'event_ids') > 0 then
        insert into guest_events (guest_id, event_id)
        select v_new_guest_id, (elem)::uuid
        from jsonb_array_elements_text(v_guest -> 'event_ids') as elem;
      end if;
    end loop;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'household_create', v_household_id::text,
            jsonb_build_object('display_name', p_display_name, 'code', v_code,
                                'guest_count', jsonb_array_length(p_guests),
                                'group_tag', p_group_tag));
  else
    select code into v_existing_code from households where id = p_household_id;
    if v_existing_code is null then
      raise exception 'household_not_found';
    end if;

    if v_code is null or length(trim(v_code)) = 0 then
      v_code := v_existing_code;
    end if;

    update households
      set display_name = p_display_name,
          code = v_code,
          group_tag = p_group_tag,
          rsvp_deadline_id = p_rsvp_deadline_id,
          hotel_covered_by_host = coalesce(p_hotel_covered_by_host, false),
          code_version = case when v_code <> v_existing_code then code_version + 1 else code_version end
      where id = p_household_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'household_update', p_household_id::text,
            jsonb_build_object('display_name', p_display_name, 'code', v_code,
                                'code_changed', v_code <> v_existing_code,
                                'group_tag', p_group_tag));

    v_household_id := p_household_id;
  end if;

  return v_household_id;
end;
$$;
