-- New Features batch (Review Notes 09.16.26):
--   1/2. WhatsApp phone numbers replace the household contact email /
--        "email us updates" opt-in collected on the RSVP form.
--   3. Admin-managed set of RSVP dates, assigned per household (mandatory),
--      replacing the single site-wide site_settings.rsvp_deadline.
--   4. Per-household "hotel covered by host" flag -- guest sees a
--      placeholder instead of hotel-block travel info.
--   5. Admin dashboard/export surfaces the WhatsApp numbers a household
--      submitted.
--   6. (Frontend-only hint text, no schema change.)
--   7. Already correct -- get_guest_context's events/wardrobe already only
--      returns events the household's guests are invited to.

-- ---------------------------------------------------------------------------
-- rsvp_deadlines: admin-managed fixed set of selectable RSVP dates.
-- ---------------------------------------------------------------------------

create table rsvp_deadlines (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  deadline timestamptz,
  created_at timestamptz not null default now()
);

alter table households
  add column rsvp_deadline_id uuid references rsvp_deadlines (id),
  add column hotel_covered_by_host boolean not null default false;

-- Backfill: carry the old site-wide deadline (if any) into a single seed
-- row so existing households have something assigned before the column
-- becomes mandatory.
insert into rsvp_deadlines (label, deadline)
select 'RSVP deadline', s.rsvp_deadline from site_settings s where s.id = true;

update households
  set rsvp_deadline_id = (select id from rsvp_deadlines limit 1);

alter table households
  alter column rsvp_deadline_id set not null;

-- ---------------------------------------------------------------------------
-- household_whatsapp_numbers: replaces contact_email / updates_opt_in.
-- ---------------------------------------------------------------------------

create table household_whatsapp_numbers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  phone_number text not null,
  label text,
  created_at timestamptz not null default now()
);

alter table households
  drop column contact_email,
  drop column updates_opt_in;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table rsvp_deadlines enable row level security;
alter table household_whatsapp_numbers enable row level security;

create policy "admin full access to rsvp_deadlines" on rsvp_deadlines
  for all using (is_admin()) with check (is_admin());
create policy "guest can read rsvp_deadlines" on rsvp_deadlines
  for select using (session_household_id() is not null);

create policy "admin full access to household_whatsapp_numbers" on household_whatsapp_numbers
  for all using (is_admin()) with check (is_admin());
create policy "guest can read own whatsapp numbers" on household_whatsapp_numbers
  for select using (household_id = session_household_id());

-- ---------------------------------------------------------------------------
-- admin_upsert_rsvp_deadline / admin_delete_rsvp_deadline
-- ---------------------------------------------------------------------------

create or replace function public.admin_upsert_rsvp_deadline(
  p_rsvp_deadline_id uuid,
  p_label text,
  p_deadline timestamptz
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

  if p_label is null or length(trim(p_label)) = 0 then
    raise exception 'label_required';
  end if;

  if p_rsvp_deadline_id is null then
    insert into rsvp_deadlines (label, deadline)
    values (p_label, p_deadline)
    returning id into v_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'rsvp_deadline_create', v_id::text,
            jsonb_build_object('label', p_label, 'deadline', p_deadline));
  else
    update rsvp_deadlines
      set label = p_label, deadline = p_deadline
      where id = p_rsvp_deadline_id;

    insert into audit_log (actor_type, actor_id, action, target, metadata)
    values ('admin', auth.jwt() ->> 'email', 'rsvp_deadline_update', p_rsvp_deadline_id::text,
            jsonb_build_object('label', p_label, 'deadline', p_deadline));

    v_id := p_rsvp_deadline_id;
  end if;

  return v_id;
end;
$$;

grant execute on function public.admin_upsert_rsvp_deadline(uuid, text, timestamptz) to authenticated;

create or replace function public.admin_delete_rsvp_deadline(p_rsvp_deadline_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if exists (select 1 from households where rsvp_deadline_id = p_rsvp_deadline_id) then
    raise exception 'rsvp_deadline_in_use';
  end if;

  delete from rsvp_deadlines where id = p_rsvp_deadline_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'rsvp_deadline_delete', p_rsvp_deadline_id::text, '{}'::jsonb);
end;
$$;

grant execute on function public.admin_delete_rsvp_deadline(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_upsert_household: drop contact_email, add rsvp_deadline_id
-- (mandatory) and hotel_covered_by_host.
-- ---------------------------------------------------------------------------

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

drop function if exists public.admin_upsert_household(uuid, text, text, text, jsonb, text);

grant execute on function public.admin_upsert_household(
  uuid, text, text, uuid, boolean, jsonb, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- submit_rsvp: drop contact_email/updates_opt_in, add whatsapp numbers
-- (household's list is fully replaced on each submission -- simplest way
-- to let a household add/remove numbers from the same freeform list).
-- Deadline enforcement now reads the household's own assigned
-- rsvp_deadlines row instead of the single site-wide site_settings one.
-- ---------------------------------------------------------------------------

create or replace function public.submit_rsvp(
  p_answers jsonb,
  p_song_request text default null,
  p_whatsapp_numbers jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_deadline timestamptz;
  v_late_edits_enabled boolean;
  v_is_new boolean;
  v_answer jsonb;
  v_guest_id uuid;
  v_event_id uuid;
  v_attending text;
  v_number jsonb;
begin
  v_household_id := session_household_id();
  if v_household_id is null then
    raise exception 'no_active_session';
  end if;

  select rd.deadline into v_deadline
    from households h
    join rsvp_deadlines rd on rd.id = h.rsvp_deadline_id
    where h.id = v_household_id;

  select late_edits_enabled into v_late_edits_enabled from site_settings where id = true;

  if v_deadline is not null and now() > v_deadline and not v_late_edits_enabled then
    raise exception 'rsvp_closed';
  end if;

  select rsvp_submitted_at is null into v_is_new from households where id = v_household_id;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    v_guest_id := (v_answer ->> 'guest_id')::uuid;
    v_event_id := (v_answer ->> 'event_id')::uuid;
    v_attending := v_answer ->> 'attending';

    if v_attending not in ('yes', 'no') then
      raise exception 'invalid_attending_value';
    end if;

    if not exists (
      select 1 from guests where id = v_guest_id and household_id = v_household_id
    ) then
      raise exception 'guest_not_in_household';
    end if;

    if not exists (
      select 1 from guest_events where guest_id = v_guest_id and event_id = v_event_id
    ) then
      raise exception 'event_not_invited';
    end if;

    insert into rsvps (guest_id, event_id, attending, responded_at)
    values (v_guest_id, v_event_id, v_attending, now())
    on conflict (guest_id, event_id) do update
      set attending = excluded.attending,
          responded_at = now(),
          edited_by_admin = null;
  end loop;

  update households
    set rsvp_submitted_at = now(),
        song_request = coalesce(p_song_request, song_request)
    where id = v_household_id;

  if p_whatsapp_numbers is not null then
    delete from household_whatsapp_numbers where household_id = v_household_id;

    for v_number in select * from jsonb_array_elements(p_whatsapp_numbers)
    loop
      if coalesce(trim(v_number ->> 'phone_number'), '') <> '' then
        insert into household_whatsapp_numbers (household_id, phone_number, label)
        values (v_household_id, trim(v_number ->> 'phone_number'), nullif(trim(v_number ->> 'label'), ''));
      end if;
    end loop;
  end if;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values (
    'guest',
    auth.uid()::text,
    case when v_is_new then 'rsvp_submit' else 'rsvp_edit' end,
    v_household_id::text,
    jsonb_build_object('answers', p_answers, 'song_request', p_song_request)
  );
end;
$$;

drop function if exists public.submit_rsvp(jsonb, text, text, boolean);

grant execute on function public.submit_rsvp(jsonb, text, jsonb) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- get_guest_context: household's rsvp deadline (joined, not the old global
-- site_settings one) + its whatsapp numbers.
-- ---------------------------------------------------------------------------

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
    'household', (
      select to_jsonb(h) || jsonb_build_object('rsvp_deadline', rd.deadline)
      from households h
      join rsvp_deadlines rd on rd.id = h.rsvp_deadline_id
      where h.id = v_household_id
    ),
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
    'site_settings', (select to_jsonb(s) from site_settings s where s.id = true),
    'travel_options', (
      select coalesce(jsonb_agg(t order by t.type, t.name), '[]'::jsonb) from travel_options t
    ),
    'faqs', (
      select coalesce(jsonb_agg(f order by f.order_index), '[]'::jsonb) from faqs f
    ),
    'whatsapp_numbers', (
      select coalesce(jsonb_agg(w order by w.created_at), '[]'::jsonb)
      from household_whatsapp_numbers w
      where w.household_id = v_household_id
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_guest_context() to authenticated, anon;
