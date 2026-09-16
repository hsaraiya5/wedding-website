import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { getWeddingStart } from "@/lib/countdown";
import { WelcomeHome, WelcomeArt, WelcomePanel, WelcomeMessage } from "@/components/welcome-home";
import { Countdown } from "@/components/countdown";
import { Section, SectionHeading } from "@/components/section";
import { EventsTimeline } from "@/components/events-timeline";
import { TravelSection } from "@/components/travel-section";
import { WardrobePlanner } from "@/components/wardrobe-planner";
import { FaqSection } from "@/components/faq-section";
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

  const { household, guests, events, guest_events, rsvps, site_settings, travel_options, faqs } =
    context;
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
              Wyndham Grand, Pittsburgh Downtown
            </>
          }
        />
        <WelcomePanel>
          <p className="wh-eyebrow gh-eyebrow">Gayathri &amp; Hrishikesh</p>
          <h1 className="wh-title">Welcome, {household.display_name}</h1>
          <WelcomeMessage text="We are so happy you will be celebrating this joyful weekend with us in Pittsburgh." />

          {weddingStart ? (
            <Countdown
              target={weddingStart}
              title="The wedding weekend begins in"
              showSeconds
              variant="main"
            />
          ) : null}

          <div className="wh-actions">
            <a href="#events" className="gh-button">
              View the itinerary
            </a>
            <a href="#rsvp" className="gh-button gh-button-secondary">
              RSVP
            </a>
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

      {travel_options.length > 0 ? (
        <Section id="travel">
          <SectionHeading
            eyebrow="Travel & stay"
            title="Three places to make your home base."
            intro="We are arranging hotel blocks for the wedding weekend. Booking links and rates will be added here as soon as they are available."
          />
          <TravelSection travelOptions={travel_options} />
        </Section>
      ) : null}

      {events.length > 0 ? (
        <Section id="wardrobe">
          <SectionHeading
            eyebrow="Wardrobe planner"
            title="Plan each look, one celebration at a time."
            intro="Choose an event to explore Indian outfit ideas, a considered color palette, and the practical details that make getting dressed easy."
          />
          <WardrobePlanner events={events} />
        </Section>
      ) : null}

      {faqs.length > 0 ? (
        <Section id="faq">
          <SectionHeading
            eyebrow="A few details"
            title="Questions, answered."
            intro="We will keep this page current as plans are finalized, so you always have one reliable place to check."
          />
          <FaqSection faqs={faqs} />
        </Section>
      ) : null}

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
