-- Admin guest-list management RPCs. Replaces the originally-planned CSV
-- import (see Decision Log) -- admins create/edit households and guests
-- directly in the UI instead. Each function is SECURITY DEFINER, so unlike
-- table access (already gated by the "admin full access" RLS policies),
-- these must explicitly check is_admin() themselves -- a grant alone would
-- let any authenticated session (including a guest) invoke them.

create or replace function public.admin_upsert_household(
  p_household_id uuid,
  p_display_name text,
  p_contact_email text,
  p_code text
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
  v_attempt int := 0;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_household_id is null then
    -- Auto-generate a code if the admin left it blank. Retry a few times
    -- on the rare chance of a collision rather than surfacing a raw
    -- constraint-violation error.
    if v_code is null or length(trim(v_code)) = 0 then
      loop
        v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
        exit when not exists (select 1 from households where lower(code) = lower(v_code));
        v_attempt := v_attempt + 1;
        if v_attempt > 5 then
          raise exception 'could_not_generate_code';
        end if;
      end loop;
    end if;

    insert into households (display_name, contact_email, code)
    values (p_display_name, p_contact_email, v_code)
    returning id into v_household_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'household_create', v_household_id::text,
            jsonb_build_object('display_name', p_display_name, 'code', v_code));
  else
    select code into v_existing_code from households where id = p_household_id;
    if v_existing_code is null then
      raise exception 'household_not_found';
    end if;

    -- A blank code on an update means "leave it as-is", not "set it empty".
    if v_code is null or length(trim(v_code)) = 0 then
      v_code := v_existing_code;
    end if;

    update households
      set display_name = p_display_name,
          contact_email = p_contact_email,
          code = v_code,
          code_version = case when v_code <> v_existing_code then code_version + 1 else code_version end
      where id = p_household_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'household_update', p_household_id::text,
            jsonb_build_object('display_name', p_display_name, 'code', v_code,
                                'code_changed', v_code <> v_existing_code));

    v_household_id := p_household_id;
  end if;

  return v_household_id;
end;
$$;

grant execute on function public.admin_upsert_household(uuid, text, text, text) to authenticated;

create or replace function public.admin_delete_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  delete from households where id = p_household_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'household_delete', p_household_id::text, '{}'::jsonb);
end;
$$;

grant execute on function public.admin_delete_household(uuid) to authenticated;

create or replace function public.admin_upsert_guest(
  p_guest_id uuid,
  p_household_id uuid,
  p_first_name text,
  p_last_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_id uuid;
  v_possible_duplicate boolean;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_guest_id is null then
    insert into guests (household_id, first_name, last_name)
    values (p_household_id, p_first_name, p_last_name)
    returning id into v_guest_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'guest_create', v_guest_id::text,
            jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name));
  else
    update guests set first_name = p_first_name, last_name = p_last_name
      where id = p_guest_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'guest_update', p_guest_id::text,
            jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name));

    v_guest_id := p_guest_id;
  end if;

  -- Soft duplicate check (US-A3): flag, never block -- weddings legitimately
  -- have guests who share a name.
  select exists (
    select 1 from guests g
    where g.id <> v_guest_id
      and lower(g.first_name) = lower(p_first_name)
      and lower(g.last_name) = lower(p_last_name)
  ) into v_possible_duplicate;

  return jsonb_build_object('guest_id', v_guest_id, 'possible_duplicate', v_possible_duplicate);
end;
$$;

grant execute on function public.admin_upsert_guest(uuid, uuid, text, text) to authenticated;

create or replace function public.admin_delete_guest(p_guest_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  delete from guests where id = p_guest_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'guest_delete', p_guest_id::text, '{}'::jsonb);
end;
$$;

grant execute on function public.admin_delete_guest(uuid) to authenticated;

-- Replaces a household's full set of invited events (US-A4). Simplest
-- correct semantics for a checkbox-list UI: diff isn't needed, just delete
-- and re-insert the whole set in one transaction.
create or replace function public.admin_set_household_events(
  p_household_id uuid,
  p_event_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  delete from household_events where household_id = p_household_id;

  insert into household_events (household_id, event_id)
  select p_household_id, unnest(p_event_ids);

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'invitations_update', p_household_id::text,
          jsonb_build_object('event_ids', p_event_ids));
end;
$$;

grant execute on function public.admin_set_household_events(uuid, uuid[]) to authenticated;
