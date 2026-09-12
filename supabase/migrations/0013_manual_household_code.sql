-- Lets an admin type a specific code directly (not just regenerate a
-- random one), same code_version-bump semantics as admin_regenerate_
-- household_code so old sessions using the previous code are still
-- invalidated immediately.

create or replace function public.admin_set_household_code(p_household_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_code text;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_code is null or length(trim(p_code)) = 0 then
    raise exception 'code_required';
  end if;

  select code into v_existing_code from households where id = p_household_id;
  if v_existing_code is null then
    raise exception 'household_not_found';
  end if;

  update households
    set code = p_code,
        code_version = case when p_code <> v_existing_code then code_version + 1 else code_version end
    where id = p_household_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'code_update', p_household_id::text,
          jsonb_build_object('new_code', p_code));
end;
$$;

grant execute on function public.admin_set_household_code(uuid, text) to authenticated;
