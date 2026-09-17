"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { describeAuditLogRow, type AuditLogLookup, type AuditLogRow } from "@/lib/audit-log";

const CATEGORIES = ["Household", "Guest", "Event", "Travel", "FAQ", "RSVP date", "RSVP", "Login"];

export function ActivityLog({
  rows,
  households,
  guests,
}: {
  rows: AuditLogRow[];
  households: Record<string, string>;
  guests: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const lookup: AuditLogLookup = { households, guests };

  const described = useMemo(
    () => rows.map((row) => ({ row, ...describeAuditLogRow(row, lookup) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- households/guests are plain objects rebuilt every render from stable server data; keying off `rows` alone avoids re-deriving on every keystroke elsewhere in this component.
    [rows]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return described.filter((entry) => {
      if (category && entry.category !== category) return false;
      if (!query) return true;
      const haystack = `${entry.label} ${entry.actorLabel} ${entry.verb}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [described, search, category]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name or actor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-full"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 rounded-full border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All activity</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No matching activity.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ row, category: entryCategory, verb, label, actorLabel }) => (
            <div
              key={row.id}
              className="av-household-card av-log-row"
              data-actor-type={row.actor_type}
            >
              <div className="av-household-header">
                <div>
                  <p className="av-section-hint flex items-center gap-2">
                    <span className={`av-actor-badge av-actor-${row.actor_type}`}>
                      {row.actor_type === "admin" ? "Admin" : row.actor_type === "guest" ? "Guest" : "System"}
                    </span>
                    {entryCategory} &middot;{" "}
                    {new Date(row.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    &middot; {actorLabel}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">{verb}</span>{" "}
                    <span className="font-heading">{label}</span>
                  </p>
                </div>
              </div>
              {Object.keys(row.metadata ?? {}).length > 0 ? (
                <details className="mt-2 text-sm text-muted-foreground">
                  <summary className="cursor-pointer select-none">Details</summary>
                  <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(row.metadata, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
