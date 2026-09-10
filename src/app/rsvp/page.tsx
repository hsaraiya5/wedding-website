import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const [
    { data: household, error: householdError },
    { data: guests },
    { data: events },
    { data: rsvps },
    { data: siteSettings },
  ] = await Promise.all([
    supabase.from("households").select("*").single(),
    supabase.from("guests").select("*").order("first_name"),
    supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase.from("rsvps").select("*"),
    supabase.from("site_settings").select("*").single(),
  ]);

  if (!household) {
    console.error("[/rsvp] household query failed:", householdError);
    redirect("/");
  }

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
