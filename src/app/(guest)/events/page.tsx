import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { Section, SectionHeading } from "@/components/section";
import { EventsTimeline } from "@/components/events-timeline";
import "@/components/site-button.css";

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
    <Section id="events">
      <SectionHeading
        eyebrow="Your itinerary"
        title="Your weekend, at a glance."
        intro="Four celebrations, two joyful days, and every detail gathered in one place."
      />

      <div className="sc-reveal flex flex-col gap-6">
        <div className="flex justify-end">
          <Link href="/rsvp" className="gh-button">
            RSVP
          </Link>
        </div>

        {events.length > 0 ? (
          <EventsTimeline events={events} />
        ) : (
          <p className="text-center text-muted-foreground">No events found for your household.</p>
        )}
      </div>
    </Section>
  );
}
