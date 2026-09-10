"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function redeemInviteCode(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "Please enter your invite code." };
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
      return { error: "Something went wrong. Please try again." };
    }
  }

  const { data, error } = await supabase.rpc("redeem_invite_code", {
    p_code: code,
  });

  if (error || !data || data.length === 0) {
    return { error: "That code doesn't look right. Double-check it and try again." };
  }

  // The household bound to this browser's session may have just changed --
  // make sure /events re-fetches rather than reusing a cached render from a
  // previous household.
  revalidatePath("/events");
  redirect("/events");
}
