import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// Every /admin/* page needs this same check. Redirects to login if there's
// no session at all; otherwise returns the user plus whether they're on the
// admin allowlist, so pages can render a friendly "not authorized" message
// rather than a hard redirect for a signed-in-but-not-admin account.
export async function requireAdminUser(
  supabase: SupabaseClient
): Promise<{ user: User; isAdmin: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");

  return { user, isAdmin: Boolean(isAdmin) };
}
