import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { AdminDashboard } from "@/components/admin-dashboard";
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
        "id, display_name, code, group_tag, rsvp_deadlines(id, label, deadline), household_whatsapp_numbers(phone_number), guests(id, first_name, last_name, guest_events(event_id, events(name)), rsvps(event_id, attending))"
      )
      .order("display_name"),
    supabase.from("events").select("id, name, event_date").order("event_date"),
  ]);

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

      <AdminDashboard households={households ?? []} events={eventsList ?? []} />
    </main>
  );
}
