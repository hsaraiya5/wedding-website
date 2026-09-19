import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { RsvpDeadlineForm } from "@/components/rsvp-deadline-form";

export const dynamic = "force-dynamic";

export default async function EditRsvpDeadlinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { data: rsvpDeadline } = await supabase
    .from("rsvp_deadlines")
    .select("*")
    .eq("id", id)
    .single();

  if (!rsvpDeadline) {
    return (
      <main className="av-page items-center text-center">
        <p className="text-muted-foreground">Not found.</p>
        <Link href="/admin/rsvp-dates" className="av-back-link">
          &larr; Back to RSVP deadlines
        </Link>
      </main>
    );
  }

  return (
    <main className="av-page">
      <Link href="/admin/rsvp-dates" className="av-back-link self-start">
        &larr; RSVP deadlines
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Edit</p>
        <h1 className="font-heading text-3xl">{rsvpDeadline.label}</h1>
        <p className="av-section-hint">
          Updating this date updates it everywhere it's assigned -- every household tagged with
          this deadline, including on their guest-facing RSVP page.
        </p>
      </div>

      <div className="av-section">
        <RsvpDeadlineForm rsvpDeadline={rsvpDeadline} />
      </div>
    </main>
  );
}
