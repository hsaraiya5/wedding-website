import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { getWeddingStart } from "@/lib/countdown";
import { WelcomeHome, WelcomeArt, WelcomePanel, WelcomeMessage } from "@/components/welcome-home";
import { Countdown } from "@/components/countdown";
import { Section, SectionHeading } from "@/components/section";
import { EventFlipCards } from "@/components/event-flip-cards";
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

  const {
    household,
    guests,
    events,
    guest_events,
    rsvps,
    site_settings,
    travel_options,
    faqs,
    whatsapp_numbers,
  } = context;
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
              {household.rsvp_submitted_at ? "View RSVP" : "RSVP"}
            </a>
          </div>
        </WelcomePanel>
      </WelcomeHome>

      <Section id="events">
        <SectionHeading
          eyebrow="Your itinerary"
          title={
            events.length === 4
              ? "Four celebrations, each with a story."
              : "Your wedding day, at a glance."
          }
          intro={
            events.length === 4
              ? "Four celebrations, two joyful days, and every detail gathered in one place."
              : "Your invitation includes the wedding ceremony and reception, with every detail gathered in one place."
          }
        />
        {events.length > 0 ? (
          <EventFlipCards events={events} />
        ) : (
          <p className="text-center text-muted-foreground">No events found for your household.</p>
        )}
      </Section>

      {travel_options.length > 0 || household.hotel_covered_by_host ? (
        <Section id="travel">
          <SectionHeading
            eyebrow="Travel & stay"
            title={
              household.hotel_covered_by_host
                ? "Your stay is already taken care of."
                : "Two downtown homes for the weekend."
            }
            intro={
              household.hotel_covered_by_host
                ? "Your room is booked and the cost is covered. We will contact your family personally with every hotel detail, so there is nothing you need to reserve."
                : "We have reserved two hotel blocks near every celebration. Booking links, rates, and deadlines will be added as soon as the blocks open."
            }
          />
          <TravelSection
            travelOptions={travel_options}
            hotelCoveredByHost={household.hotel_covered_by_host}
          />
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
        whatsappNumbers={whatsapp_numbers}
        justSubmitted={submitted === "1"}
      />

      <SiteFooter />
    </>
  );
}
