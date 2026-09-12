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
  const { data: newId, error } = await supabase.rpc("admin_upsert_household", {
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
    redirect(`/admin/households/${newId}`);
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

export async function deleteHousehold(householdId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_household", {
    p_household_id: householdId,
  });

  if (error) {
    throw new Error("Something went wrong deleting the household.");
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function saveGuest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const guestId = String(formData.get("guest_id") ?? "").trim() || null;
  const householdId = String(formData.get("household_id") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "First and last name are both required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_upsert_guest", {
    p_guest_id: guestId,
    p_household_id: householdId,
    p_first_name: firstName,
    p_last_name: lastName,
  });

  if (error) {
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
