import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { HouseholdDetailsForm } from "@/components/household-details-form";
import { CodeManagement } from "@/components/code-management";
import { GuestManager } from "@/components/guest-manager";
import { DeleteHouseholdButton } from "@/components/delete-household-button";

export const dynamic = "force-dynamic";

export default async function EditHouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const [{ data: household }, { data: guests }, { data: events }] = await Promise.all([
    supabase.from("households").select("*").eq("id", id).single(),
    supabase.from("guests").select("*").eq("household_id", id).order("first_name"),
    supabase.from("events").select("id, name, event_date").order("event_date"),
  ]);

  if (!household) {
    return (
      <main className="av-page items-center text-center">
        <p className="text-muted-foreground">Household not found.</p>
        <Link href="/admin" className="av-back-link">
          &larr; Back to dashboard
        </Link>
      </main>
    );
  }

  const guestIds = (guests ?? []).map((g) => g.id);
  const { data: guestEvents } =
    guestIds.length > 0
      ? await supabase.from("guest_events").select("guest_id, event_id").in("guest_id", guestIds)
      : { data: [] };

  return (
    <main className="av-page">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Household</p>
          <h1 className="font-heading text-3xl">{household.display_name}</h1>
        </div>
        <DeleteHouseholdButton householdId={household.id} displayName={household.display_name} />
      </div>

      <div className="av-section">
        <h2 className="av-section-title">Household details</h2>
        <HouseholdDetailsForm household={household} />
        <div className="border-t border-border pt-5">
          <CodeManagement key={household.code} householdId={household.id} code={household.code} />
        </div>
      </div>

      <div className="av-section" id="guests">
        <h2 className="av-section-title">Guests</h2>
        <GuestManager
          householdId={household.id}
          guests={guests ?? []}
          events={events ?? []}
          guestEvents={guestEvents ?? []}
        />
      </div>
    </main>
  );
}
