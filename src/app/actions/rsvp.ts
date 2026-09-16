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
  const dietaryNeeds = String(formData.get("dietary_needs") ?? "").trim() || null;
  const accessibilityNeeds = String(formData.get("accessibility_needs") ?? "").trim() || null;
  const householdNote = String(formData.get("household_note") ?? "").trim() || null;
  const whatsappNumbersRaw = String(formData.get("whatsapp_numbers") ?? "");

  let whatsappNumbers: { phone_number: string }[] = [];
  try {
    whatsappNumbers = JSON.parse(whatsappNumbersRaw || "[]");
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_rsvp", {
    p_answers: answers,
    p_song_request: songRequest,
    p_whatsapp_numbers: whatsappNumbers,
    p_dietary_needs: dietaryNeeds,
    p_accessibility_needs: accessibilityNeeds,
    p_household_note: householdNote,
  });

  if (error) {
    if (error.message.includes("rsvp_closed")) {
      return {
        error: "The RSVP deadline has passed and edits are no longer accepted.",
      };
    }
    return { error: "Something went wrong submitting your RSVP. Please try again." };
  }

  // The household's rsvp_submitted_at / rsvps just changed -- make sure the
  // read-only summary reflects that instead of a cached prior render.
  revalidatePath("/home");
  redirect("/home?submitted=1#rsvp");
}
