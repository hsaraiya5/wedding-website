import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { HouseholdsTable } from "@/components/households-table";
import { HouseholdCreatedDialog } from "@/components/household-created-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const [{ data: households }, { data: events }] = await Promise.all([
    supabase
      .from("households")
      .select(
        "id, display_name, code, group_tag, guests(id, first_name, last_name, guest_events(event_id, events(name)), rsvps(event_id, attending))"
      )
      .order("display_name"),
    supabase.from("events").select("id, name, event_date").order("event_date"),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <Suspense fallback={null}>
        <HouseholdCreatedDialog />
      </Suspense>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <p className="text-muted-foreground">Signed in as {user.email}</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Households</CardTitle>
        </CardHeader>
        <CardContent>
          <HouseholdsTable households={households ?? []} events={events ?? []} />
        </CardContent>
      </Card>
    </main>
  );
}
