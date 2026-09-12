-- Adds a free-text "group" tag to households (e.g. "Saraiya", "Manchella",
-- "Hrishikesh Friends") so admins can filter/search the guest list by which
-- side/group a household belongs to. Free text rather than a fixed enum --
-- groups are specific to this wedding and may get added to over time.

alter table households add column group_tag text;

-- Learned the hard way in 0008/0009: adding a parameter via CREATE OR
-- REPLACE FUNCTION creates a new overload when argument types change,
-- rather than truly replacing the function. Drop the old signature
-- explicitly in the same migration this time instead of as a follow-up fix.

create or replace function public.admin_upsert_household(
  p_household_id uuid,
  p_display_name text,
  p_contact_email text,
  p_code text,
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
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_household_id is null then
    if p_guests is null or jsonb_array_length(p_guests) = 0 then
      raise exception 'household_needs_at_least_one_guest';
    end if;

    if v_code is null or length(trim(v_code)) = 0 then
      v_code := generate_unique_household_code();
    end if;

    insert into households (display_name, contact_email, code, group_tag)
    values (p_display_name, p_contact_email, v_code, p_group_tag)
    returning id into v_household_id;

    for v_guest in select * from jsonb_array_elements(p_guests)
    loop
      insert into guests (household_id, first_name, last_name)
      values (v_household_id, v_guest ->> 'first_name', v_guest ->> 'last_name');
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
          contact_email = p_contact_email,
          code = v_code,
          group_tag = p_group_tag,
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

drop function if exists public.admin_upsert_household(uuid, text, text, text, jsonb);

grant execute on function public.admin_upsert_household(uuid, text, text, text, jsonb, text) to authenticated;
