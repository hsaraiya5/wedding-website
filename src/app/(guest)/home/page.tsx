import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { getWeddingStart } from "@/lib/countdown";
import { WelcomeHome, WelcomeArt, WelcomePanel } from "@/components/welcome-home";
import { Countdown } from "@/components/countdown";
import { Section, SectionHeading } from "@/components/section";
import { EventsTimeline } from "@/components/events-timeline";
import { RsvpForm } from "@/components/rsvp-form";
import { SiteFooter } from "@/components/site-footer";
import "@/components/site-button.css";

// Depends on the session's bound household -- never cache.
export const dynamic = "force-dynamic";

// The handoff is a single scrolling page: the invite gate hands off to one
// document holding every section (#welcome, #events, ... #rsvp) with the
// nav as smooth-scroll anchors. /events and /rsvp stay as redirects into
// the matching anchor so existing links and bookmarks keep working.
export default async function HomePage({
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
  const weddingStart = getWeddingStart(events);
  const { submitted } = await searchParams;

  return (
    <>
      <WelcomeHome>
        <WelcomeArt
          mapUrl="https://www.google.com/maps/search/?api=1&query=Wyndham+Grand+Pittsburgh+Downtown"
          caption={
            <>
              May 29-30, 2027
              <br />
              Wyndham Pittsburgh
            </>
          }
        />
        <WelcomePanel>
          <p className="wh-eyebrow gh-eyebrow">Gayathri &amp; Hrishikesh</p>
          <h1 className="wh-title">Welcome, {household.display_name}</h1>
          <p className="wh-message">
            We are so happy you will be celebrating this joyful weekend with us in Pittsburgh.
          </p>

          {weddingStart ? (
            <Countdown
              target={weddingStart}
              title="The wedding weekend begins in"
              showSeconds
              variant="main"
            />
          ) : null}

          <div className="wh-actions">
            <Link href="#events" className="gh-button">
              View the itinerary
            </Link>
            <Link href="#rsvp" className="gh-button gh-button-secondary">
              RSVP
            </Link>
          </div>
        </WelcomePanel>
      </WelcomeHome>

      <Section id="events">
        <SectionHeading
          eyebrow="Your itinerary"
          title="Your weekend, at a glance."
          intro="Four celebrations, two joyful days, and every detail gathered in one place."
        />
        {events.length > 0 ? (
          <EventsTimeline events={events} />
        ) : (
          <p className="text-center text-muted-foreground">No events found for your household.</p>
        )}
      </Section>

      <RsvpForm
        household={household}
        guests={guests}
        events={events}
        guestEvents={guest_events}
        existingRsvps={rsvps}
        siteSettings={site_settings}
        justSubmitted={submitted === "1"}
      />

      <SiteFooter />
    </>
  );
}
