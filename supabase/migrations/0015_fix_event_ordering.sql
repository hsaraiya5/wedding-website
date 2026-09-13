-- get_guest_context's events aggregation used
-- jsonb_agg(distinct to_jsonb(e)) to dedupe an event appearing once per
-- invited guest (a household with 2 guests both invited to the same event
-- would otherwise list it twice). Postgres requires ORDER BY expressions
-- inside an aggregate-level DISTINCT to match the aggregated expression
-- itself, so there was no way to also ORDER BY event_date/start_time there
-- -- the events list came back in arbitrary order. Fix: dedupe via a
-- subquery first, then aggregate+order the already-distinct rows.

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
      select coalesce(jsonb_agg(sub order by sub.event_date, sub.start_time), '[]'::jsonb)
      from (
        select distinct e.*
        from events e
        join guest_events ge on ge.event_id = e.id
        join guests g on g.id = ge.guest_id
        where g.household_id = v_household_id
      ) sub
    ),
    'guest_events', (
      select coalesce(jsonb_agg(jsonb_build_object('guest_id', ge.guest_id, 'event_id', ge.event_id)), '[]'::jsonb)
      from guest_events ge
      join guests g on g.id = ge.guest_id
      where g.household_id = v_household_id
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
