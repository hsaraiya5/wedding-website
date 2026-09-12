-- Dedicated code-regeneration RPC (US-A5): a leaked/lost code should be
-- revocable in one explicit action, distinct from the general household
-- edit form's "leave code blank to keep it as-is" semantics.

create or replace function public.generate_unique_household_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempt int := 0;
begin
  loop
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    exit when not exists (select 1 from households where lower(code) = lower(v_code));
    v_attempt := v_attempt + 1;
    if v_attempt > 5 then
      raise exception 'could_not_generate_code';
    end if;
  end loop;
  return v_code;
end;
$$;

-- Reuse the shared generator instead of duplicating the retry loop.
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
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_household_id is null then
    if v_code is null or length(trim(v_code)) = 0 then
      v_code := generate_unique_household_code();
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

create or replace function public.admin_regenerate_household_code(p_household_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_code text;
  v_updated_id uuid;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  v_new_code := generate_unique_household_code();

  update households
    set code = v_new_code, code_version = code_version + 1
    where id = p_household_id
    returning id into v_updated_id;

  if v_updated_id is null then
    raise exception 'household_not_found';
  end if;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'code_regenerate', p_household_id::text,
          jsonb_build_object('new_code', v_new_code));

  return v_new_code;
end;
$$;

grant execute on function public.admin_regenerate_household_code(uuid) to authenticated;
