import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return new NextResponse("Not authorized", { status: 403 });
  }

  const [{ data: households }, { data: rsvps }] = await Promise.all([
    supabase
      .from("households")
      .select(
        "id, display_name, code, group_tag, rsvp_submitted_at, dietary_needs, accessibility_needs, household_note, household_whatsapp_numbers(phone_number), guests(id, first_name, last_name, guest_events(events(name)))"
      )
      .order("display_name"),
    supabase.from("rsvps").select("guest_id, event_id, attending"),
  ]);

  const eventNameById = new Map<string, string>();

  const rsvpsByGuest = new Map<string, { event_id: string; attending: string | null }[]>();
  for (const rsvp of rsvps ?? []) {
    const list = rsvpsByGuest.get(rsvp.guest_id) ?? [];
    list.push(rsvp);
    rsvpsByGuest.set(rsvp.guest_id, list);
  }

  // Build event id -> name from the events table directly, since rsvps only
  // carries event_id.
  const { data: events } = await supabase.from("events").select("id, name");
  for (const event of events ?? []) {
    eventNameById.set(event.id, event.name);
  }

  const rows: string[][] = [
    [
      "Household",
      "Group",
      "Code",
      "WhatsApp Numbers",
      "Guest First Name",
      "Guest Last Name",
      "Invited Events",
      "RSVP Status",
      "RSVP Submitted At",
      "Dietary Needs",
      "Accessibility Needs",
      "Household Note",
    ],
  ];

  for (const household of households ?? []) {
    const whatsappNumbers = household.household_whatsapp_numbers
      .map((n) => n.phone_number)
      .join("; ");

    for (const guest of household.guests) {
      const invitedEventNames = guest.guest_events
        .flatMap((ge) => ge.events)
        .filter(Boolean)
        .map((e) => e!.name)
        .join("; ");

      const guestRsvps = rsvpsByGuest.get(guest.id) ?? [];
      const rsvpStatus = guestRsvps
        .map((r) => `${eventNameById.get(r.event_id) ?? "Unknown event"}: ${r.attending === "yes" ? "Yes" : r.attending === "no" ? "No" : "Pending"}`)
        .join("; ");

      rows.push([
        household.display_name,
        household.group_tag ?? "",
        household.code,
        whatsappNumbers,
        guest.first_name,
        guest.last_name,
        invitedEventNames,
        rsvpStatus,
        household.rsvp_submitted_at ?? "",
        household.dietary_needs ?? "",
        household.accessibility_needs ?? "",
        household.household_note ?? "",
      ]);
    }
  }

  const csv = rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="guest-list-${timestamp}.csv"`,
    },
  });
}
