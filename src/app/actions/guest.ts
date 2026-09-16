"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RedeemCodeState = {
  error: string | null;
  householdName: string | null;
};

// Doesn't redirect on success -- returns the household name so the client
// can run the invite-card/envelope entrance animation first, then navigate
// to /home itself once it finishes.
export async function redeemInviteCode(
  _prevState: RedeemCodeState,
  formData: FormData
): Promise<RedeemCodeState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "Please enter your invite code.", householdName: null };
  }

  const supabase = await createClient();

  // Every guest session is an anonymous Supabase auth user, linked to a
  // household by redeem_invite_code. Create one if this browser doesn't
  // have a session yet.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      return { error: "Something went wrong. Please try again.", householdName: null };
    }
  }

  const { data, error } = await supabase.rpc("redeem_invite_code", {
    p_code: code,
  });

  if (error || !data || data.length === 0) {
    return {
      error: "That code did not work. Check the invitation and try again.",
      householdName: null,
    };
  }

  // The household bound to this browser's session may have just changed --
  // make sure the guest pages re-fetch rather than reusing a cached render
  // from a previous household.
  revalidatePath("/home");
  revalidatePath("/events");

  return { error: null, householdName: data[0].household_name as string };
}
