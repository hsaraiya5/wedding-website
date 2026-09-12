import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
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

  const context = await getGuestContext(supabase);
  if (!context) {
    redirect("/");
  }

  const { household, guests, events, rsvps, site_settings } = context;
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
        guests={guests}
        events={events}
        existingRsvps={rsvps}
        siteSettings={site_settings}
        justSubmitted={submitted === "1"}
      />
    </main>
  );
}
