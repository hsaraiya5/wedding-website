import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">
          Signed in as {user.email}, but that account isn&apos;t on the admin
          allowlist.
        </p>
      </main>
    );
  }

  const { data: households } = await supabase
    .from("households")
    .select("id, display_name, code, guests(first_name, last_name), household_events(events(name))")
    .order("display_name");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-muted-foreground">Signed in as {user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Households</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Household</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Invited events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {households?.map((household) => (
                <TableRow key={household.id}>
                  <TableCell className="font-medium">
                    {household.display_name}
                  </TableCell>
                  <TableCell>
                    <code>{household.code}</code>
                  </TableCell>
                  <TableCell>
                    {household.guests
                      .map((g) => `${g.first_name} ${g.last_name}`)
                      .join(", ")}
                  </TableCell>
                  <TableCell>
                    {household.household_events
                      .flatMap((he) => he.events)
                      .map((event) => event?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
