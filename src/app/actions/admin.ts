"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

export async function saveHousehold(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const householdId = String(formData.get("household_id") ?? "").trim() || null;
  const displayName = String(formData.get("display_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const code = String(formData.get("code") ?? "").trim() || null;
  const groupTag = String(formData.get("group_tag") ?? "").trim() || null;
  const guestsRaw = String(formData.get("guests") ?? "");

  if (!displayName) {
    return { error: "Household name is required." };
  }

  let guests: { first_name: string; last_name: string; event_ids?: string[] }[] | null = null;
  if (!householdId) {
    try {
      guests = JSON.parse(guestsRaw || "[]");
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
    if (!guests || guests.length === 0) {
      return { error: "Add at least one guest before creating the household." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_upsert_household", {
    p_household_id: householdId,
    p_display_name: displayName,
    p_contact_email: contactEmail,
    p_code: code,
    p_guests: guests,
    p_group_tag: groupTag,
  });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { error: "That code is already in use by another household." };
    }
    if (error.message.includes("household_needs_at_least_one_guest")) {
      return { error: "Add at least one guest before creating the household." };
    }
    return { error: "Something went wrong saving the household. Please try again." };
  }

  revalidatePath("/admin");
  if (!householdId) {
    redirect(`/admin?created=${encodeURIComponent(displayName)}`);
  }
  revalidatePath(`/admin/households/${householdId}`);
  return { error: null };
}

export async function regenerateCode(householdId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_regenerate_household_code", {
    p_household_id: householdId,
  });

  if (error) {
    throw new Error("Something went wrong regenerating the code.");
  }

  revalidatePath(`/admin/households/${householdId}`);
  revalidatePath("/admin");
}

export async function setHouseholdCode(householdId: string, code: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_household_code", {
    p_household_id: householdId,
    p_code: code,
  });

  if (error) {
    if (error.message.includes("duplicate key")) {
      throw new Error("That code is already in use by another household.");
    }
    if (error.message.includes("code_required")) {
      throw new Error("Enter a code.");
    }
    throw new Error("Something went wrong saving the code.");
  }

  revalidatePath(`/admin/households/${householdId}`);
  revalidatePath("/admin");
}

export async function deleteHousehold(householdId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_household", {
    p_household_id: householdId,
  });

  if (error) {
    throw new Error("Something went wrong deleting the household.");
  }

  // No redirect() here -- this is called from two different places (the
  // dashboard list and a household's own edit page), each of which needs
  // different post-delete navigation. redirect()'ing to /admin was a no-op
  // when already on /admin (same-path "redirect" doesn't force the client
  // router to refetch), which is why deleting a household from the
  // dashboard left stale counts/rows on screen. Each caller now handles
  // its own navigation via router.push/refresh in DeleteHouseholdButton.
  revalidatePath("/admin");
}

export async function saveGuest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const guestId = String(formData.get("guest_id") ?? "").trim() || null;
  const householdId = String(formData.get("household_id") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const eventIdsRaw = String(formData.get("event_ids") ?? "");

  if (!firstName || !lastName) {
    return { error: "First and last name are both required." };
  }

  let eventIds: string[] | null = null;
  if (!guestId) {
    try {
      eventIds = JSON.parse(eventIdsRaw || "[]");
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
    if (!eventIds || eventIds.length === 0) {
      return { error: "Select at least one event this guest is invited to." };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_upsert_guest", {
    p_guest_id: guestId,
    p_household_id: householdId,
    p_first_name: firstName,
    p_last_name: lastName,
    p_event_ids: eventIds,
  });

  if (error) {
    if (error.message.includes("guest_needs_at_least_one_event")) {
      return { error: "Select at least one event this guest is invited to." };
    }
    return { error: "Something went wrong saving the guest. Please try again." };
  }

  revalidatePath(`/admin/households/${householdId}`);

  if (data?.possible_duplicate) {
    return {
      error: `Heads up: another guest named "${firstName} ${lastName}" already exists. Saved anyway.`,
    };
  }

  return { error: null };
}

export async function deleteGuest(guestId: string, householdId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_guest", { p_guest_id: guestId });

  if (error) {
    throw new Error("Something went wrong removing the guest.");
  }

  revalidatePath(`/admin/households/${householdId}`);
}

export async function saveGuestInvitations(
  guestId: string,
  householdId: string,
  eventIds: string[]
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_guest_events", {
    p_guest_id: guestId,
    p_event_ids: eventIds,
  });

  if (error) {
    throw new Error("Something went wrong saving invitations.");
  }

  revalidatePath(`/admin/households/${householdId}`);
  revalidatePath("/admin");
}

// Parses the wardrobe form's palette textarea -- one "Name: #hexcode" per
// line -- into the array shape WardrobePlanner expects. A plain textarea
// with a documented format is simpler than a repeating color-picker UI,
// and gives admins full control (any number of swatches, easy to reorder)
// without extra client-side plumbing.
function parsePalette(raw: string): { name: string; hex: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, hex] = line.split(":").map((part) => part.trim());
      return { name: name || "Color", hex: hex || "#000000" };
    })
    .filter((color) => /^#[0-9a-fA-F]{3,8}$/.test(color.hex));
}

export async function saveEvent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim() || null;
  const startTime = String(formData.get("start_time") ?? "").trim() || null;
  const endTime = String(formData.get("end_time") ?? "").trim() || null;
  const venueName = String(formData.get("venue_name") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const dressCode = String(formData.get("dress_code") ?? "").trim() || null;
  const mealInfo = String(formData.get("meal_info") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const wardrobeTitle = String(formData.get("wardrobe_title") ?? "").trim();
  const wardrobeDescription = String(formData.get("wardrobe_description") ?? "").trim();
  const wardrobeGoodToKnow = String(formData.get("wardrobe_good_to_know") ?? "").trim();
  const wardrobePaletteRaw = String(formData.get("wardrobe_palette") ?? "");

  if (!name) {
    return { error: "Event name is required." };
  }
  if (!eventId) {
    return { error: "Something went wrong. Please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_upsert_event", {
    p_event_id: eventId,
    p_name: name,
    p_event_date: eventDate,
    p_start_time: startTime,
    p_end_time: endTime,
    p_venue_name: venueName,
    p_address: address,
    p_dress_code: dressCode,
    p_meal_info: mealInfo,
    p_description: description,
    p_extra_content: {
      wardrobe: {
        title: wardrobeTitle || undefined,
        description: wardrobeDescription || undefined,
        good_to_know: wardrobeGoodToKnow || undefined,
        palette: parsePalette(wardrobePaletteRaw),
      },
    },
  });

  if (error) {
    return { error: "Something went wrong saving the event. Please try again." };
  }

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/home");
  return { error: null };
}

export async function saveTravelOption(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const travelOptionId = String(formData.get("travel_option_id") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const bookingCode = String(formData.get("booking_code") ?? "").trim() || null;
  const bookingLink = String(formData.get("booking_link") ?? "").trim() || null;
  const nightlyRate = String(formData.get("nightly_rate") ?? "").trim() || null;
  const rateCutoffDate = String(formData.get("rate_cutoff_date") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) {
    return { error: "Name is required." };
  }
  if (!["hotel-block", "other-hotel", "transport"].includes(type)) {
    return { error: "Choose a type." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_upsert_travel_option", {
    p_travel_option_id: travelOptionId,
    p_type: type,
    p_name: name,
    p_booking_code: bookingCode,
    p_booking_link: bookingLink,
    p_nightly_rate: nightlyRate,
    p_rate_cutoff_date: rateCutoffDate,
    p_description: description,
  });

  if (error) {
    return { error: "Something went wrong saving this. Please try again." };
  }

  revalidatePath("/admin/travel");
  revalidatePath("/home");
  redirect("/admin/travel");
}

export async function deleteTravelOption(travelOptionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_travel_option", {
    p_travel_option_id: travelOptionId,
  });

  if (error) {
    throw new Error("Something went wrong deleting this.");
  }

  revalidatePath("/admin/travel");
  revalidatePath("/home");
}

export async function saveFaq(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const faqId = String(formData.get("faq_id") ?? "").trim() || null;
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const orderIndexRaw = String(formData.get("order_index") ?? "").trim();
  const orderIndex = orderIndexRaw ? Number.parseInt(orderIndexRaw, 10) : 0;

  if (!question || !answer) {
    return { error: "Both a question and an answer are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_upsert_faq", {
    p_faq_id: faqId,
    p_question: question,
    p_answer: answer,
    p_order_index: Number.isNaN(orderIndex) ? 0 : orderIndex,
  });

  if (error) {
    return { error: "Something went wrong saving this. Please try again." };
  }

  revalidatePath("/admin/faq");
  revalidatePath("/home");
  redirect("/admin/faq");
}

export async function deleteFaq(faqId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_faq", { p_faq_id: faqId });

  if (error) {
    throw new Error("Something went wrong deleting this.");
  }

  revalidatePath("/admin/faq");
  revalidatePath("/home");
}

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
