import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { GuestNotes, type NoteKind } from "@/components/guest-notes";

export const dynamic = "force-dynamic";

const KINDS: NoteKind[] = ["note", "dietary", "access"];

export default async function AdminNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { tab } = await searchParams;
  const initialKind = KINDS.find((kind) => kind === tab) ?? "note";

  // Every household -- the guest list is small, and GuestNotes drops the ones
  // that left a given field blank.
  const { data: households } = await supabase
    .from("households")
    .select(
      "id, display_name, group_tag, rsvp_submitted_at, household_note, dietary_needs, accessibility_needs, guests(first_name, last_name)"
    )
    .order("rsvp_submitted_at", { ascending: false, nullsFirst: false });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Guest notes</p>
        <h1 className="font-heading text-3xl">What guests told us</h1>
        <p className="av-section-hint mt-2">
          Everything households wrote on their RSVP, newest first. Pick a list, then copy it to
          share, say the dietary needs with the caterer.
        </p>
      </div>

      <GuestNotes households={households ?? []} initialKind={initialKind} />
    </main>
  );
}
