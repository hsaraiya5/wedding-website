import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { EventDetailsForm } from "@/components/event-details-form";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();

  // Matches the guest-facing ordering (see get_guest_context), so the
  // preview's accent color lines up with what guests actually see for
  // this event instead of always defaulting to the first color.
  const { data: orderedEvents } = await supabase
    .from("events")
    .select("id")
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });
  const eventIndex = Math.max(0, orderedEvents?.findIndex((e) => e.id === id) ?? 0);

  if (!event) {
    return (
      <main className="av-page items-center text-center">
        <p className="text-muted-foreground">Event not found.</p>
        <Link href="/admin/events" className="av-back-link">
          &larr; Back to events
        </Link>
      </main>
    );
  }

  return (
    <main className="av-page">
      <Link href="/admin/events" className="av-back-link self-start">
        &larr; Events
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Event</p>
        <h1 className="font-heading text-3xl">{event.name}</h1>
      </div>

      <div className="av-section">
        <EventDetailsForm event={event} eventIndex={eventIndex} />
      </div>
    </main>
  );
}
