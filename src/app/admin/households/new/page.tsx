import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { getExistingGroupTags } from "@/lib/group-tags";
import { NotAuthorized } from "@/components/not-authorized";
import { HouseholdDetailsForm } from "@/components/household-details-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewHouseholdPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const existingGroupTags = await getExistingGroupTags(supabase);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">New household</h1>

      <Card>
        <CardHeader>
          <CardTitle>Household details</CardTitle>
        </CardHeader>
        <CardContent>
          <HouseholdDetailsForm household={null} existingGroupTags={existingGroupTags} />
        </CardContent>
      </Card>
    </main>
  );
}
