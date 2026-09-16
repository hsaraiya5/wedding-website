import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { HouseholdsTable } from "@/components/households-table";
import { HouseholdCreatedDialog } from "@/components/household-created-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const [{ data: households }, { data: eventsList }] = await Promise.all([
    supabase
      .from("households")
      .select(
        "id, display_name, code, group_tag, household_whatsapp_numbers(phone_number), guests(id, first_name, last_name, guest_events(event_id, events(name)), rsvps(event_id, attending))"
      )
      .order("display_name"),
    supabase.from("events").select("id, name, event_date").order("event_date"),
  ]);

  const allGuests = (households ?? []).flatMap((h) => h.guests);
  const totalHouseholds = households?.length ?? 0;
  const totalGuests = allGuests.length;
  const rsvpYes = allGuests.reduce(
    (sum, g) => sum + g.rsvps.filter((r) => r.attending === "yes").length,
    0
  );
  const invitedCount = allGuests.reduce((sum, g) => sum + g.guest_events.length, 0);
  const respondedCount = allGuests.reduce((sum, g) => sum + g.rsvps.length, 0);
  const pendingCount = Math.max(0, invitedCount - respondedCount);

  const stats = [
    { label: "Households", value: totalHouseholds },
    { label: "Guests", value: totalGuests },
    { label: "Yes RSVPs", value: rsvpYes },
    { label: "Pending RSVPs", value: pendingCount },
  ];

  // Per-event breakdown -- "Yes RSVPs" above is a total across every
  // event, which can't answer "how many said yes to the Haldi specifically"
  // without opening every household. This answers that in zero clicks.
  const eventStats = (eventsList ?? []).map((event) => {
    let invited = 0;
    let yes = 0;
    let no = 0;
    for (const guest of allGuests) {
      if (!guest.guest_events.some((ge) => ge.event_id === event.id)) continue;
      invited += 1;
      const rsvp = guest.rsvps.find((r) => r.event_id === event.id);
      if (rsvp?.attending === "yes") yes += 1;
      else if (rsvp?.attending === "no") no += 1;
    }
    return { id: event.id, name: event.name, invited, yes, no, pending: invited - yes - no };
  });

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-8 py-10">
      <Suspense fallback={null}>
        <HouseholdCreatedDialog />
      </Suspense>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Admin</p>
          <h1 className="font-heading text-3xl">Wedding dashboard</h1>
        </div>
        <div className="flex gap-2">
          <a href="/admin/export" className={cn(buttonVariants({ variant: "outline" }))}>
            Export CSV
          </a>
          <Link href="/admin/households/new" className={buttonVariants()}>
            New household
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="av-stat">
            <span className="av-stat-value">{stat.value}</span>
            <span className="av-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {eventStats.length > 0 ? (
        <div>
          <h2 className="mb-4 font-heading text-xl">RSVPs by event</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {eventStats.map((event) => (
              <div key={event.id} className="av-event-stat">
                <span className="av-event-stat-name">{event.name}</span>
                <div className="av-event-stat-main">
                  <strong>{event.yes}</strong>
                  <span>of {event.invited} yes</span>
                </div>
                <div className="av-event-stat-breakdown">
                  <span>
                    <span className="av-no">{event.no}</span> no
                  </span>
                  <span>
                    <span className="av-pending">{event.pending}</span> pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-5 font-heading text-xl">Households</h2>
        <HouseholdsTable households={households ?? []} />
      </div>
    </main>
  );
}
