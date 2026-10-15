-- Some guests are only ever known by one name (a child in the family, a
-- plus-one whose surname nobody has), and the admin form required a last
-- name to save at all -- admins were typing "." to get past it. Make
-- guests.last_name optional.
--
-- Empty string and NULL both have to mean "no last name" because the HTML
-- form posts "" for an untouched input, so every write normalises via
-- nullif(btrim(...), '') and existing placeholder-empty rows are cleaned up.

alter table guests alter column last_name drop not null;

update guests set last_name = null where btrim(last_name) = '';

-- admin_upsert_guest: normalise the incoming last name, and make the
-- duplicate-name check null-safe. "lower(g.last_name) = lower(p_last_name)"
-- evaluates to NULL (not true) when both sides are null, which would have
-- silently stopped flagging duplicates for single-name guests.
create or replace function public.admin_upsert_guest(
  p_guest_id uuid,
  p_household_id uuid,
  p_first_name text,
  p_last_name text,
  p_event_ids uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_id uuid;
  v_last_name text := nullif(btrim(p_last_name), '');
  v_possible_duplicate boolean;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if nullif(btrim(p_first_name), '') is null then
    raise exception 'guest_needs_first_name';
  end if;

  if p_guest_id is null then
    if p_event_ids is null or array_length(p_event_ids, 1) is null or array_length(p_event_ids, 1) = 0 then
      raise exception 'guest_needs_at_least_one_event';
    end if;

    insert into guests (household_id, first_name, last_name)
    values (p_household_id, p_first_name, v_last_name)
    returning id into v_guest_id;

    insert into guest_events (guest_id, event_id)
    select v_guest_id, unnest(p_event_ids);

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'guest_create', v_guest_id::text,
            jsonb_build_object('first_name', p_first_name, 'last_name', v_last_name,
                                'event_ids', p_event_ids));
  else
    update guests set first_name = p_first_name, last_name = v_last_name
      where id = p_guest_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'guest_update', p_guest_id::text,
            jsonb_build_object('first_name', p_first_name, 'last_name', v_last_name));

    v_guest_id := p_guest_id;
  end if;

  select exists (
    select 1 from guests g
    where g.id <> v_guest_id
      and lower(g.first_name) = lower(p_first_name)
      and lower(g.last_name) is not distinct from lower(v_last_name)
  ) into v_possible_duplicate;

  return jsonb_build_object('guest_id', v_guest_id, 'possible_duplicate', v_possible_duplicate);
end;
$$;

grant execute on function public.admin_upsert_guest(uuid, uuid, text, text, uuid[]) to authenticated;

-- admin_upsert_household: same normalisation for guests created inline with
-- a new household. Unchanged from 0019 apart from the last_name expression
-- and the first-name guard.
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
      if nullif(btrim(v_guest ->> 'first_name'), '') is null then
        raise exception 'guest_needs_first_name';
      end if;

      insert into guests (household_id, first_name, last_name)
      values (v_household_id, v_guest ->> 'first_name',
              nullif(btrim(v_guest ->> 'last_name'), ''))
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
