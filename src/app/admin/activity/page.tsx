import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { ActivityLog } from "@/components/activity-log";
import type { AuditLogRow } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

// 300 rows is a v0 cap, not a real pagination story -- enough for
// realistic browsing without building "load more" UI up front. Raise it
// (or add pagination) once it turns out to matter.
const ROW_LIMIT = 300;

export default async function AdminActivityPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const [{ data: rows }, { data: households }, { data: guests }] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, actor_type, actor_id, action, target, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT),
    supabase.from("households").select("id, display_name"),
    supabase.from("guests").select("id, first_name, last_name"),
  ]);

  const householdMap = Object.fromEntries((households ?? []).map((h) => [h.id, h.display_name]));
  const guestMap = Object.fromEntries(
    (guests ?? []).map((g) => [g.id, [g.first_name, g.last_name].filter(Boolean).join(" ")])
  );

  return (
    <main className="av-page">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Activity</p>
        <h1 className="font-heading text-3xl">Who changed what</h1>
        <p className="av-section-hint mt-2">
          Every admin edit and guest RSVP submission, most recent first. Showing the last {ROW_LIMIT}.
        </p>
      </div>

      <ActivityLog rows={(rows ?? []) as AuditLogRow[]} households={householdMap} guests={guestMap} />
    </main>
  );
}
