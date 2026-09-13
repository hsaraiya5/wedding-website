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

  const { household, guests, events, guest_events, rsvps, site_settings } = context;
  const { submitted } = await searchParams;

  return (
    <RsvpForm
      household={household}
      guests={guests}
      events={events}
      guestEvents={guest_events}
      existingRsvps={rsvps}
      siteSettings={site_settings}
      justSubmitted={submitted === "1"}
    />
  );
}
