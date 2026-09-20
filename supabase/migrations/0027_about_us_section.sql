-- "About us" section copy (the two story paragraphs) and photos become
-- admin-editable, living on the site_settings singleton alongside the
-- other section-copy overrides (see 0026_travel_section_copy.sql).

alter table site_settings
  add column about_body_1 text,
  add column about_body_2 text,
  add column about_photos jsonb not null default '[]'::jsonb;

create or replace function public.admin_update_about_us(
  p_body_1 text,
  p_body_2 text,
  p_photos jsonb
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
    set about_body_1 = p_body_1,
        about_body_2 = p_body_2,
        about_photos = coalesce(p_photos, '[]'::jsonb)
    where id = true;

  insert into audit_log (actor_type, actor_id, action, target, metadata)
  values ('admin', auth.jwt() ->> 'email', 'about_us_update', 'site_settings', '{}'::jsonb);
end;
$$;

grant execute on function public.admin_update_about_us(text, text, jsonb) to authenticated;
