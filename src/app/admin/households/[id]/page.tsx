import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { HouseholdDetailsForm } from "@/components/household-details-form";
import { CodeManagement } from "@/components/code-management";
import { GuestManager } from "@/components/guest-manager";
import { InvitationsForm } from "@/components/invitations-form";
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

  const [{ data: household }, { data: guests }, { data: events }, { data: householdEvents }] =
    await Promise.all([
      supabase.from("households").select("*").eq("id", id).single(),
      supabase.from("guests").select("*").eq("household_id", id).order("first_name"),
      supabase.from("events").select("id, name, event_date").order("event_date"),
      supabase.from("household_events").select("event_id").eq("household_id", id),
    ]);

  if (!household) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Household not found.</p>
      </main>
    );
  }

  const invitedEventIds = (householdEvents ?? []).map((he) => he.event_id);

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
          <HouseholdDetailsForm household={household} />
          <CodeManagement householdId={household.id} code={household.code} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guests</CardTitle>
        </CardHeader>
        <CardContent>
          <GuestManager householdId={household.id} guests={guests ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invited events</CardTitle>
        </CardHeader>
        <CardContent>
          <InvitationsForm
            householdId={household.id}
            events={events ?? []}
            invitedEventIds={invitedEventIds}
          />
        </CardContent>
      </Card>
    </main>
  );
}
