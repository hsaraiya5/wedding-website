"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { formatEventDayFull, formatRsvpDeadlineDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type RsvpDeadline = { label: string; deadline: string | null };

type Household = {
  id: string;
  display_name: string;
  group_tag: string | null;
  // The RSVP date is assigned to the household, so a guest's own date is
  // whichever one their household carries.
  rsvp_deadlines: RsvpDeadline | RsvpDeadline[] | null;
};

type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  // Supabase types a to-one embed as either the row or an array of rows
  // depending on how it infers the relationship, so normalise both.
  households: Household | Household[] | null;
  guest_events: { event_id: string }[];
  rsvps: { event_id: string; attending: "yes" | "no" | null }[];
};

type Event = { id: string; name: string; event_date: string | null; start_time: string | null };

type Status = "yes" | "no" | "pending";

function household(guest: Guest): Household | null {
  if (Array.isArray(guest.households)) return guest.households[0] ?? null;
  return guest.households;
}

function deadlineOf(household: Household | null): RsvpDeadline | null {
  if (!household) return null;
  if (Array.isArray(household.rsvp_deadlines)) return household.rsvp_deadlines[0] ?? null;
  return household.rsvp_deadlines;
}

function deadlineText(deadline: RsvpDeadline | null): string {
  if (!deadline) return "";
  return deadline.deadline ? formatRsvpDeadlineDate(deadline.deadline) : deadline.label;
}

export function EventGuestList({
  events,
  guests,
  initialEventId,
}: {
  events: Event[];
  guests: Guest[];
  initialEventId?: string;
}) {
  const [eventId, setEventId] = useState(
    () => events.find((e) => e.id === initialEventId)?.id ?? events[0]?.id ?? ""
  );
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [search, setSearch] = useState("");

  const invited = useMemo(() => {
    return guests
      .filter((guest) => guest.guest_events.some((ge) => ge.event_id === eventId))
      .map((guest) => {
        const attending = guest.rsvps.find((r) => r.event_id === eventId)?.attending;
        const status: Status = attending === "yes" ? "yes" : attending === "no" ? "no" : "pending";
        const guestHousehold = household(guest);
        return {
          guest,
          status,
          household: guestHousehold,
          deadline: deadlineOf(guestHousehold),
        };
      })
      .sort((a, b) => {
        const byHousehold = (a.household?.display_name ?? "").localeCompare(
          b.household?.display_name ?? ""
        );
        return byHousehold !== 0
          ? byHousehold
          : a.guest.first_name.localeCompare(b.guest.first_name);
      });
  }, [guests, eventId]);

  const counts = useMemo(
    () => ({
      yes: invited.filter((row) => row.status === "yes").length,
      no: invited.filter((row) => row.status === "no").length,
      pending: invited.filter((row) => row.status === "pending").length,
    }),
    [invited]
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invited.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (!query) return true;
      return [row.guest.first_name, row.guest.last_name, row.household?.display_name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [invited, statusFilter, search]);

  const selectedEvent = events.find((e) => e.id === eventId);

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No events yet.</p>;
  }

  const tiles: { label: string; value: number; status: Status | null }[] = [
    { label: "Invited", value: invited.length, status: null },
    { label: "Yes", value: counts.yes, status: "yes" },
    { label: "No", value: counts.no, status: "no" },
    { label: "Unanswered", value: counts.pending, status: "pending" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={eventId}
          onChange={(e) => {
            setEventId(e.target.value);
            setStatusFilter(null);
          }}
          className="h-9 rounded-full border border-input bg-transparent px-4 text-sm"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
        {selectedEvent?.event_date ? (
          <span className="av-section-hint">{formatEventDayFull(selectedEvent.event_date)}</span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((tile) => {
          const active = tile.status !== null && statusFilter === tile.status;
          return (
            <button
              key={tile.label}
              type="button"
              disabled={tile.status === null}
              onClick={() => setStatusFilter(active ? null : tile.status)}
              className={cn(
                "av-stat text-left",
                tile.status !== null && "cursor-pointer",
                active && "ring-2 ring-primary"
              )}
            >
              <span className="av-stat-value">{tile.value}</span>
              <span className="av-stat-label">{tile.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by guest or household name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-full"
        />
        <span className="text-sm text-muted-foreground">
          Showing {rows.length} of {invited.length} invited
        </span>
        {statusFilter ? (
          <button
            type="button"
            onClick={() => setStatusFilter(null)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear status filter
          </button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {invited.length === 0
            ? "Nobody is invited to this event yet."
            : "No guests match this filter."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.guest.id} className="av-guest-summary-row">
              <span className="av-guest-summary-name">
                {row.guest.first_name} {row.guest.last_name}
              </span>
              {row.household ? (
                <Link
                  href={`/admin/households/${row.household.id}`}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {row.household.display_name}
                </Link>
              ) : null}
              {row.household?.group_tag ? (
                <span className="av-pill bg-muted text-foreground">{row.household.group_tag}</span>
              ) : null}
              {row.deadline ? (
                <span className="text-xs text-muted-foreground">
                  RSVP by {deadlineText(row.deadline)}
                </span>
              ) : null}
              <span
                className={cn(
                  "av-pill ml-auto",
                  row.status === "yes" && "av-pill-yes",
                  row.status === "no" && "av-pill-no",
                  row.status === "pending" && "av-pill-pending"
                )}
              >
                {row.status === "yes" ? "Yes" : row.status === "no" ? "No" : "Unanswered"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
