-- 0008 added p_guests as a new trailing parameter, but CREATE OR REPLACE
-- FUNCTION does not replace a function whose argument *types* differ --
-- Postgres treats it as a new overload. That left the old 4-argument
-- admin_upsert_household(uuid, text, text, text) callable alongside the
-- new 5-argument version, and a 4-argument call resolves to the old one
-- (exact arity match wins over a default-filled match) -- silently
-- bypassing the new "household needs at least one guest" check entirely.
-- Drop the old overload so only the 5-argument version exists.

drop function if exists public.admin_upsert_household(uuid, text, text, text);

grant execute on function public.admin_upsert_household(uuid, text, text, text, jsonb) to authenticated;
