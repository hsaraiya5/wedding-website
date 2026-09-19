import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { DeleteItemButton } from "@/components/delete-item-button";
import { RsvpDeadlineForm } from "@/components/rsvp-deadline-form";
import { deleteRsvpDeadline } from "@/app/actions/admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRsvpDeadlineDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminRsvpDatesPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { data: rsvpDeadlines } = await supabase
    .from("rsvp_deadlines")
    .select("*")
    .order("deadline");

  return (
    <main className="av-page">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">RSVP dates</p>
        <h1 className="font-heading text-3xl">RSVP deadlines</h1>
        <p className="av-section-hint">
          Households are each assigned one of these dates on their household page. Add as many as
          you need -- e.g. different deadlines for different groups.
        </p>
      </div>

      <div className="av-section">
        <h2 className="av-section-title">Add a date</h2>
        <RsvpDeadlineForm />
      </div>

      <div className="flex flex-col gap-4">
        {(rsvpDeadlines ?? []).length === 0 ? (
          <p className="text-muted-foreground">No RSVP dates yet -- add one above.</p>
        ) : null}
        {(rsvpDeadlines ?? []).map((rd) => (
          <div key={rd.id} className="av-household-card">
            <div className="av-household-header">
              <div>
                <p className="av-section-hint">
                  {rd.deadline ? formatRsvpDeadlineDate(rd.deadline) : "No date set"}
                </p>
                <h2 className="font-heading text-xl">{rd.label}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/rsvp-dates/${rd.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Edit
                </Link>
                <DeleteItemButton
                  deleteAction={deleteRsvpDeadline}
                  id={rd.id}
                  confirmMessage={`Delete "${rd.label}"? This can't be undone.`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
