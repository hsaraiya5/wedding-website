import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { getWeddingStart } from "@/lib/countdown";
import { Countdown } from "@/components/countdown";
import { buttonVariants } from "@/components/ui/button";

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
    <main className="flex flex-col items-center gap-10 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          Gayathri &amp; Hrishikesh
        </p>
        <h1 className="font-script text-5xl text-accent-foreground">
          Welcome, {context.household.display_name}
        </h1>
        <p className="max-w-md text-muted-foreground">
          We are so happy you will be celebrating this joyful weekend with us in Pittsburgh.
        </p>
      </div>

      {weddingStart ? (
        <Countdown target={weddingStart} title="The wedding weekend begins in" showSeconds />
      ) : null}

      <div className="flex gap-3">
        <Link href="/events" className={buttonVariants()}>
          View the itinerary
        </Link>
        <Link href="/rsvp" className={buttonVariants({ variant: "outline" })}>
          RSVP
        </Link>
      </div>
    </main>
  );
}
