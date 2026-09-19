-- Travel & Stay section copy (the "getting here" and "book your hotel by
-- X" notices shown above the hotel cards) becomes admin-editable, living
-- on the site_settings singleton alongside the other global site chrome.

alter table site_settings
  add column travel_getting_here_title text,
  add column travel_getting_here_body text,
  add column travel_notice_title text,
  add column travel_notice_body text;

create or replace function public.admin_update_travel_copy(
  p_getting_here_title text,
  p_getting_here_body text,
  p_notice_title text,
  p_notice_body text
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

  update site_settings
    set travel_getting_here_title = p_getting_here_title,
        travel_getting_here_body = p_getting_here_body,
        travel_notice_title = p_notice_title,
        travel_notice_body = p_notice_body
    where id = true;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'travel_copy_update', 'site_settings', '{}'::jsonb);
end;
$$;

grant execute on function public.admin_update_travel_copy(text, text, text, text) to authenticated;
