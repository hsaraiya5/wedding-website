"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { guestFullName } from "@/lib/format";

export type NoteKind = "note" | "dietary" | "access";

type Household = {
  id: string;
  display_name: string;
  group_tag: string | null;
  rsvp_submitted_at: string | null;
  household_note: string | null;
  dietary_needs: string | null;
  accessibility_needs: string | null;
  guests: { first_name: string; last_name: string | null }[];
};

const KIND_INFO: { kind: NoteKind; label: string; field: keyof Household; empty: string }[] = [
  { kind: "note", label: "Notes for the couple", field: "household_note", empty: "No notes yet." },
  { kind: "dietary", label: "Dietary & allergies", field: "dietary_needs", empty: "No dietary needs submitted yet." },
  { kind: "access", label: "Accessibility & mobility", field: "accessibility_needs", empty: "No accessibility needs submitted yet." },
];

function textFor(household: Household, field: keyof Household): string {
  const value = household[field];
  return typeof value === "string" ? value.trim() : "";
}

function submittedText(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// One list at a time, picked from count tiles (the same pattern as the
// guest list's status tiles), so each reads as a clean column of entries
// rather than three fields crammed onto every household.
export function GuestNotes({
  households,
  initialKind,
}: {
  households: Household[];
  initialKind: NoteKind;
}) {
  const [kind, setKind] = useState<NoteKind>(initialKind);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const info = KIND_INFO.find((entry) => entry.kind === kind)!;

  const counts = useMemo(
    () =>
      Object.fromEntries(
        KIND_INFO.map((entry) => [
          entry.kind,
          households.filter((h) => textFor(h, entry.field)).length,
        ])
      ) as Record<NoteKind, number>,
    [households]
  );

  const entries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return households
      .map((household) => ({ household, text: textFor(household, info.field) }))
      .filter(({ household, text }) => {
        if (!text) return false;
        if (!query) return true;
        const haystack = [
          household.display_name,
          text,
          ...household.guests.map((g) => guestFullName(g.first_name, g.last_name)),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
  }, [households, info.field, search]);

  const copyAll = async () => {
    const body = entries.map(({ household, text }) => `${household.display_name}: ${text}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(`${info.label}\n\n${body}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure origin, denied permission); the
      // list is still on screen to select by hand.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {KIND_INFO.map((entry) => (
          <button
            key={entry.kind}
            type="button"
            onClick={() => {
              setKind(entry.kind);
              setCopied(false);
            }}
            aria-pressed={kind === entry.kind}
            className="av-stat cursor-pointer text-left"
          >
            <span className="av-stat-value">{counts[entry.kind]}</span>
            <span className="av-stat-label">{entry.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search names or text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-full"
        />
        <span className="text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? "household" : "households"}
        </span>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={copyAll}
            className="ml-auto text-sm font-medium text-primary hover:underline"
          >
            {copied ? "Copied" : "Copy all"}
          </button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {counts[kind] === 0 ? info.empty : "Nothing matches your search."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(({ household, text }) => (
            <article key={household.id} className="av-household-card av-note-card">
              <p className="av-note-text">{text}</p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm">
                <Link
                  href={`/admin/households/${household.id}`}
                  className="font-heading text-base hover:text-primary"
                >
                  {household.display_name}
                </Link>
                {household.group_tag ? (
                  <span className="av-pill bg-muted text-foreground">{household.group_tag}</span>
                ) : null}
                <span className="text-muted-foreground">
                  {household.guests.map((g) => guestFullName(g.first_name, g.last_name)).join(", ")}
                </span>
                {household.rsvp_submitted_at ? (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {submittedText(household.rsvp_submitted_at)}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
