import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    .select("id, display_name, code, guests(first_name, last_name, guest_events(events(name)))")
    .order("display_name");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
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
                    <Link href={`/admin/households/${household.id}`} className="hover:underline">
                      {household.display_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <code>{household.code}</code>
                  </TableCell>
                  <TableCell>
                    {household.guests
                      .map((g) => `${g.first_name} ${g.last_name}`)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {household.guests
                      .map((guest) => {
                        const eventNames = guest.guest_events
                          .flatMap((ge) => ge.events)
                          .map((event) => event?.name)
                          .filter(Boolean)
                          .join(", ");
                        return `${guest.first_name}: ${eventNames || "none"}`;
                      })
                      .join("; ")}
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
