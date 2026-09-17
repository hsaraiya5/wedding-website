// Resolves a raw audit_log row into something displayable. Every
// *_create/*_update action already stores a human-readable name in
// metadata (see supabase/migrations); *_delete actions do too as of
// 0024_audit_log_delete_names.sql. The household/guest lookup maps only
// exist to cover the handful of actions whose target is a household but
// whose metadata doesn't carry its name (code_regenerate, code_update,
// rsvp_submit, rsvp_edit), plus a graceful fallback for any older rows
// that predate a given migration.

export type AuditLogRow = {
  id: string;
  actor_type: "guest" | "admin" | "system";
  actor_id: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AuditLogLookup = {
  households: Record<string, string>;
  guests: Record<string, string>;
};

type ActionInfo = { category: string; verb: string; metadataKey?: string };

const ACTIONS: Record<string, ActionInfo> = {
  household_create: { category: "Household", verb: "Created", metadataKey: "display_name" },
  household_update: { category: "Household", verb: "Updated", metadataKey: "display_name" },
  household_delete: { category: "Household", verb: "Deleted", metadataKey: "display_name" },
  code_regenerate: { category: "Household", verb: "Regenerated invite code for" },
  code_update: { category: "Household", verb: "Set invite code for" },
  guest_create: { category: "Guest", verb: "Added" },
  guest_update: { category: "Guest", verb: "Updated" },
  guest_delete: { category: "Guest", verb: "Removed" },
  invitations_update: { category: "Guest", verb: "Updated invited events for" },
  event_update: { category: "Event", verb: "Updated", metadataKey: "name" },
  travel_option_create: { category: "Travel", verb: "Added", metadataKey: "name" },
  travel_option_update: { category: "Travel", verb: "Updated", metadataKey: "name" },
  travel_option_delete: { category: "Travel", verb: "Deleted", metadataKey: "name" },
  faq_create: { category: "FAQ", verb: "Added", metadataKey: "question" },
  faq_update: { category: "FAQ", verb: "Updated", metadataKey: "question" },
  faq_delete: { category: "FAQ", verb: "Deleted", metadataKey: "question" },
  rsvp_deadline_create: { category: "RSVP date", verb: "Added", metadataKey: "label" },
  rsvp_deadline_update: { category: "RSVP date", verb: "Updated", metadataKey: "label" },
  rsvp_deadline_delete: { category: "RSVP date", verb: "Deleted", metadataKey: "label" },
  rsvp_submit: { category: "RSVP", verb: "Submitted RSVP for" },
  rsvp_edit: { category: "RSVP", verb: "Edited RSVP for" },
  code_entry: { category: "Login", verb: "Logged in as" },
};

function guestName(metadata: Record<string, unknown>): string | null {
  const first = metadata.first_name;
  const last = metadata.last_name;
  if (typeof first !== "string" && typeof last !== "string") return null;
  return [first, last].filter((part): part is string => typeof part === "string" && part.length > 0).join(" ");
}

export function describeAuditLogRow(row: AuditLogRow, lookup: AuditLogLookup) {
  const info = ACTIONS[row.action] ?? { category: "Other", verb: row.action };
  const target = row.target;

  const metadataName =
    (info.metadataKey ? (row.metadata[info.metadataKey] as string | undefined) : undefined) ??
    guestName(row.metadata) ??
    undefined;

  const label =
    metadataName ||
    (target ? lookup.households[target] : undefined) ||
    (target ? lookup.guests[target] : undefined) ||
    (target ? `#${target.slice(0, 8)}` : "unknown");

  const actorLabel =
    row.actor_type === "guest" && target && lookup.households[target]
      ? `${lookup.households[target]} household`
      : (row.actor_id ?? "unknown");

  return { category: info.category, verb: info.verb, label, actorLabel };
}
