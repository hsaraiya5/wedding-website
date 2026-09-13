import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { HouseholdsTable } from "@/components/households-table";
import { HouseholdCreatedDialog } from "@/components/household-created-dialog";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { data: households } = await supabase
    .from("households")
    .select(
      "id, display_name, code, group_tag, guests(id, first_name, last_name, guest_events(event_id, events(name)), rsvps(event_id, attending))"
    )
    .order("display_name");

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
          <a href="/admin/export" className={buttonVariants({ variant: "outline" })}>
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

      <div className="av-card p-8">
        <h2 className="mb-5 font-heading text-xl">Households</h2>
        <HouseholdsTable households={households ?? []} />
      </div>
    </main>
  );
}
