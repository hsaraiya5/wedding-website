import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionHouseholdId } from "@/lib/guest-session";
import { RsvpForm } from "@/components/rsvp-form";

// Depends on the session's bound household, same as /events -- never cache.
export const dynamic = "force-dynamic";

export default async function RsvpPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const householdId = await getSessionHouseholdId(supabase);
  if (!householdId) {
    redirect("/");
  }

  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("*")
    .eq("id", householdId)
    .single();

  if (!household) {
    console.error("[/rsvp] household query failed:", householdError);
    redirect("/");
  }

  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .eq("household_id", householdId)
    .order("first_name");

  const guestIds = (guests ?? []).map((g) => g.id);

  const { data: householdEvents } = await supabase
    .from("household_events")
    .select("event_id")
    .eq("household_id", householdId);

  const eventIds = (householdEvents ?? []).map((he) => he.event_id);
  const safeEventIds = eventIds.length > 0 ? eventIds : ["00000000-0000-0000-0000-000000000000"];
  const safeGuestIds = guestIds.length > 0 ? guestIds : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: events }, { data: rsvps }, { data: siteSettings }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .in("id", safeEventIds)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase.from("rsvps").select("*").in("guest_id", safeGuestIds),
    supabase.from("site_settings").select("*").single(),
  ]);

  const { submitted } = await searchParams;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">RSVP</h1>
        <p className="text-muted-foreground">
          For {household.display_name}
        </p>
      </div>

      <RsvpForm
        household={household}
        guests={guests ?? []}
        events={events ?? []}
        existingRsvps={rsvps ?? []}
        siteSettings={siteSettings}
        justSubmitted={submitted === "1"}
      />
    </main>
  );
}
