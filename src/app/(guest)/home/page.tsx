import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { getWeddingStart } from "@/lib/countdown";
import { WelcomeHome, WelcomeArt, WelcomePanel } from "@/components/welcome-home";
import { Countdown } from "@/components/countdown";
import "@/components/site-button.css";

// Depends on the session's bound household -- never cache.
export const dynamic = "force-dynamic";

export default async function HomePage() {
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

  const weddingStart = getWeddingStart(context.events);

  return (
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
        <p className="wh-eyebrow text-xs font-bold uppercase tracking-wide text-primary">
          Gayathri &amp; Hrishikesh
        </p>
        <h1 className="wh-title">Welcome, {context.household.display_name}</h1>
        <p className="wh-message">
          We are so happy you will be celebrating this joyful weekend with us in Pittsburgh.
        </p>

        {weddingStart ? (
          <Countdown target={weddingStart} title="The wedding weekend begins in" showSeconds variant="main" />
        ) : null}

        <div className="wh-actions">
          <Link href="/events" className="gh-button">
            View the itinerary
          </Link>
          <Link href="/rsvp" className="gh-button gh-button-secondary">
            RSVP
          </Link>
        </div>
      </WelcomePanel>
    </WelcomeHome>
  );
}
