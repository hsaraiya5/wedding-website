import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { getExistingGroupTags } from "@/lib/group-tags";
import { NotAuthorized } from "@/components/not-authorized";
import { HouseholdDetailsForm } from "@/components/household-details-form";
import { CodeManagement } from "@/components/code-management";
import { GuestManager } from "@/components/guest-manager";
import { DeleteHouseholdButton } from "@/components/delete-household-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Household not found.</p>
      </main>
    );
  }

  const guestIds = (guests ?? []).map((g) => g.id);
  const [{ data: guestEvents }, existingGroupTags] = await Promise.all([
    guestIds.length > 0
      ? supabase.from("guest_events").select("guest_id, event_id").in("guest_id", guestIds)
      : Promise.resolve({ data: [] }),
    getExistingGroupTags(supabase),
  ]);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{household.display_name}</h1>
        <DeleteHouseholdButton householdId={household.id} displayName={household.display_name} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Household details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <HouseholdDetailsForm household={household} existingGroupTags={existingGroupTags} />
          <CodeManagement key={household.code} householdId={household.id} code={household.code} />
        </CardContent>
      </Card>

      <Card id="guests">
        <CardHeader>
          <CardTitle>Guests</CardTitle>
        </CardHeader>
        <CardContent>
          <GuestManager
            householdId={household.id}
            guests={guests ?? []}
            events={events ?? []}
            guestEvents={guestEvents ?? []}
          />
        </CardContent>
      </Card>
    </main>
  );
}
