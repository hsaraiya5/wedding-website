import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { HouseholdDetailsForm } from "@/components/household-details-form";

export default async function NewHouseholdPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const [{ data: events }, { data: rsvpDeadlines }] = await Promise.all([
    supabase.from("events").select("id, name, event_date").order("event_date"),
    supabase.from("rsvp_deadlines").select("id, label, deadline").order("deadline"),
  ]);

  return (
    <main className="av-page">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">New household</p>
        <h1 className="font-heading text-3xl">Add a household</h1>
      </div>

      <div className="av-section">
        <h2 className="av-section-title">Household details</h2>
        <HouseholdDetailsForm household={null} events={events ?? []} rsvpDeadlines={rsvpDeadlines ?? []} />
      </div>
    </main>
  );
}
