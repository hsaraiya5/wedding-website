-- The admin activity/audit-trail UI needs to show what was deleted, not
-- just an opaque uuid -- every *_delete function logged metadata = '{}'
-- with no name captured before the row was removed. Fixes that by
-- selecting the name first, same as the *_create/*_update functions
-- already do. Pure `create or replace`, same signatures/guards, no
-- behavior change beyond the richer log entry.

create or replace function public.admin_delete_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  select display_name into v_display_name from households where id = p_household_id;

  delete from households where id = p_household_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'household_delete', p_household_id::text,
          jsonb_build_object('display_name', v_display_name));
end;
$$;

create or replace function public.admin_delete_guest(p_guest_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_name text;
  v_last_name text;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  select first_name, last_name into v_first_name, v_last_name from guests where id = p_guest_id;

  delete from guests where id = p_guest_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'guest_delete', p_guest_id::text,
          jsonb_build_object('first_name', v_first_name, 'last_name', v_last_name));
end;
$$;

create or replace function public.admin_delete_faq(p_faq_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question text;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  select question into v_question from faqs where id = p_faq_id;

  delete from faqs where id = p_faq_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'faq_delete', p_faq_id::text,
          jsonb_build_object('question', v_question));
end;
$$;

create or replace function public.admin_delete_travel_option(p_travel_option_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  select name into v_name from travel_options where id = p_travel_option_id;

  delete from travel_options where id = p_travel_option_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'travel_option_delete', p_travel_option_id::text,
          jsonb_build_object('name', v_name));
end;
$$;

create or replace function public.admin_delete_rsvp_deadline(p_rsvp_deadline_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
begin
  if not is_admin() then
    raise exception 'not_authorized';
  end if;

  if exists (select 1 from households where rsvp_deadline_id = p_rsvp_deadline_id) then
    raise exception 'rsvp_deadline_in_use';
  end if;

  select label into v_label from rsvp_deadlines where id = p_rsvp_deadline_id;

  delete from rsvp_deadlines where id = p_rsvp_deadline_id;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'rsvp_deadline_delete', p_rsvp_deadline_id::text,
          jsonb_build_object('label', v_label));
end;
$$;
