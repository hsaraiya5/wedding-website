-- Public bucket for static design/branding assets (logo art, botanical
-- illustrations from the design handoff). Public read since these are
-- non-sensitive branding images; writes gated to admins via the same
-- is_admin() function used everywhere else.

insert into storage.buckets (id, name, public)
values ('design-assets', 'design-assets', true)
on conflict (id) do nothing;

create policy "public can read design-assets" on storage.objects
  for select using (bucket_id = 'design-assets');

create policy "admin can manage design-assets" on storage.objects
  for all using (bucket_id = 'design-assets' and is_admin())
  with check (bucket_id = 'design-assets' and is_admin());
