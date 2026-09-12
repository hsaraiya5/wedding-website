import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { EventsTimeline } from "@/components/events-timeline";
import { buttonVariants } from "@/components/ui/button";

// This page's content depends on which household the caller's session is
// bound to, which can change (e.g. redeeming a different invite code in the
// same browser) without the URL changing -- never cache it.
export const dynamic = "force-dynamic";

export default async function EventsPage() {
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

  const { events } = context;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Your itinerary</p>
          <h1 className="font-heading text-3xl">Your weekend, at a glance.</h1>
        </div>
        <Link href="/rsvp" className={buttonVariants()}>
          RSVP
        </Link>
      </div>

      {events.length > 0 ? (
        <EventsTimeline events={events} />
      ) : (
        <p className="text-muted-foreground">No events found for your household.</p>
      )}
    </main>
  );
}
