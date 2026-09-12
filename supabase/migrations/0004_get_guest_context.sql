-- Bundles everything the guest-facing pages (/events, /rsvp) need into one
-- round-trip instead of several sequential ones (resolve household id ->
-- household -> guests -> invited event ids -> events/rsvps/settings).
-- SECURITY DEFINER is safe here because every sub-query below is itself
-- scoped by v_household_id, resolved the same way session_household_id()
-- already does -- this doesn't grant anything RLS wouldn't have.

create or replace function public.get_guest_context()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_result jsonb;
begin
  v_household_id := session_household_id();
  if v_household_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'household', (select to_jsonb(h) from households h where h.id = v_household_id),
    'guests', (
      select coalesce(jsonb_agg(g order by g.first_name), '[]'::jsonb)
      from guests g where g.household_id = v_household_id
    ),
    'events', (
      select coalesce(jsonb_agg(e order by e.event_date, e.start_time), '[]'::jsonb)
      from events e
      join household_events he on he.event_id = e.id
      where he.household_id = v_household_id
    ),
    'rsvps', (
      select coalesce(jsonb_agg(r), '[]'::jsonb)
      from rsvps r
      join guests g on g.id = r.guest_id
      where g.household_id = v_household_id
    ),
    'site_settings', (select to_jsonb(s) from site_settings s where s.id = true)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_guest_context() to authenticated, anon;
