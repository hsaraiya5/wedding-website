import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your events</h1>
          <p className="text-muted-foreground">
            Here&apos;s what you&apos;re invited to.
          </p>
        </div>
        <Link href="/rsvp" className={buttonVariants()}>
          RSVP
        </Link>
      </div>

      {events.length > 0 ? (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{event.name}</CardTitle>
                  <Badge variant="secondary">
                    {event.event_date} &middot; {event.start_time}
                  </Badge>
                </div>
                <CardDescription>{event.venue_name}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>{event.address}</p>
                <p>Dress code: {event.dress_code}</p>
                <p>Meal: {event.meal_info}</p>
                <p>{event.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No events found for your household.</p>
      )}
    </main>
  );
}
