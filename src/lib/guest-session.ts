import type { SupabaseClient } from "@supabase/supabase-js";

// Resolves which household this session is bound to via redeem_invite_code,
// independent of RLS table-visibility. Guest pages must filter their
// queries by this id explicitly rather than relying on RLS visibility
// alone -- a session that happens to also be an admin (e.g. someone testing
// both flows in the same browser) is visible to every household under the
// admin RLS policies, which silently broadens "my household's events" into
// "every event" if the query isn't scoped explicitly.
export async function getSessionHouseholdId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase.rpc("session_household_id");
  if (error || !data) {
    return null;
  }
  return data as string;
}
