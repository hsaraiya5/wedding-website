import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { EventGuestList } from "@/components/event-guest-list";

export const dynamic = "force-dynamic";

export default async function AdminGuestListPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { event: selectedEventId } = await searchParams;

  const [{ data: events }, { data: guests }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_date, start_time")
      .order("event_date")
      .order("start_time"),
    supabase
      .from("guests")
      .select(
        "id, first_name, last_name, households(id, display_name, group_tag), guest_events(event_id), rsvps(event_id, attending)"
      )
      .order("first_name"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Guest list</p>
        <h1 className="font-heading text-3xl">Guest list by event</h1>
        <p className="av-section-hint mt-2">
          Pick an event to see everyone invited to it and where their RSVP stands. Tap a count to
          narrow the list to just those guests.
        </p>
      </div>

      <EventGuestList
        events={events ?? []}
        guests={guests ?? []}
        initialEventId={selectedEventId}
      />
    </main>
  );
}
