"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Answer = { guest_id: string; event_id: string; attending: "yes" | "no" };

export async function submitRsvp(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const answersRaw = formData.get("answers");
  if (typeof answersRaw !== "string") {
    return { error: "Something went wrong. Please try again." };
  }

  let answers: Answer[];
  try {
    answers = JSON.parse(answersRaw);
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return { error: "Please answer for at least one event before submitting." };
  }

  const songRequest = String(formData.get("song_request") ?? "").trim() || null;
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const updatesOptIn = formData.get("updates_opt_in") === "on";

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_rsvp", {
    p_answers: answers,
    p_song_request: songRequest,
    p_contact_email: contactEmail,
    p_updates_opt_in: updatesOptIn,
  });

  if (error) {
    if (error.message.includes("rsvp_closed")) {
      return {
        error: "The RSVP deadline has passed and edits are no longer accepted.",
      };
    }
    if (error.message.includes("invalid_contact_email")) {
      return { error: "That email address doesn't look right. Please check it and try again." };
    }
    return { error: "Something went wrong submitting your RSVP. Please try again." };
  }

  // The household's rsvp_submitted_at / rsvps just changed -- make sure the
  // read-only summary reflects that instead of a cached prior render.
  revalidatePath("/home");
  redirect("/home?submitted=1#rsvp");
}
