-- Adding a guest to an existing household (GuestManager's "Add a guest")
-- never got the same "pick invited events up front" treatment household
-- creation did -- a newly added guest had zero invited events until the
-- admin separately used the per-guest invitations UI. Require at least one
-- event at guest-creation time, same rule as households.
--
-- New trailing parameter -> new overload, same as before -- drop the old
-- 4-argument signature explicitly in this migration.

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
  v_possible_duplicate boolean;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_guest_id is null then
    if p_event_ids is null or array_length(p_event_ids, 1) is null or array_length(p_event_ids, 1) = 0 then
      raise exception 'guest_needs_at_least_one_event';
    end if;

    insert into guests (household_id, first_name, last_name)
    values (p_household_id, p_first_name, p_last_name)
    returning id into v_guest_id;

    insert into guest_events (guest_id, event_id)
    select v_guest_id, unnest(p_event_ids);

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'guest_create', v_guest_id::text,
            jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name,
                                'event_ids', p_event_ids));
  else
    update guests set first_name = p_first_name, last_name = p_last_name
      where id = p_guest_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'guest_update', p_guest_id::text,
            jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name));

    v_guest_id := p_guest_id;
  end if;

  select exists (
    select 1 from guests g
    where g.id <> v_guest_id
      and lower(g.first_name) = lower(p_first_name)
      and lower(g.last_name) = lower(p_last_name)
  ) into v_possible_duplicate;

  return jsonb_build_object('guest_id', v_guest_id, 'possible_duplicate', v_possible_duplicate);
end;
$$;

drop function if exists public.admin_upsert_guest(uuid, uuid, text, text);

grant execute on function public.admin_upsert_guest(uuid, uuid, text, text, uuid[]) to authenticated;
