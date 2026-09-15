import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { formatEventDayFull, formatEventTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, start_time, venue_name")
    .order("event_date")
    .order("start_time");

  return (
    <main className="av-page">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Events</p>
        <h1 className="font-heading text-3xl">Event details & wardrobe planner</h1>
        <p className="av-section-hint mt-2">
          The event list itself is fixed for this wedding -- edit each event&apos;s details, dress
          code, and Wardrobe planner content below.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {(events ?? []).map((event) => (
          <Link key={event.id} href={`/admin/events/${event.id}`} className="av-household-card">
            <div className="av-household-header">
              <div>
                <h2 className="font-heading text-xl">{event.name}</h2>
                <p className="av-section-hint">
                  {formatEventDayFull(event.event_date)}
                  {event.start_time ? ` · ${formatEventTime(event.start_time)}` : ""}
                  {event.venue_name ? ` · ${event.venue_name}` : ""}
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">Edit &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
