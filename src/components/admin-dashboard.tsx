"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  HouseholdsTable,
  rsvpDeadline,
  deadlineText,
  type Household,
  type RsvpDeadline,
} from "@/components/households-table";

type Event = { id: string; name: string };

// Owns the filter state so the stat tiles and the per-event cards count the
// same households the list below is showing -- a group or RSVP-date filter
// that left the totals at their site-wide values made the numbers read as
// contradicting each other.
export function AdminDashboard({
  households,
  events,
}: {
  households: Household[];
  events: Event[];
}) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  // Tracks only the collapsed ids, so households default to expanded and a
  // newly added one shows its guests without needing to be seeded here.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const set = new Set(households.map((h) => h.group_tag).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [households]);

  // Deadlines actually in use, soonest first, so the filter only ever offers
  // dates that would return something.
  const deadlines = useMemo(() => {
    const byId = new Map<string, RsvpDeadline>();
    for (const household of households) {
      const deadline = rsvpDeadline(household);
      if (deadline) byId.set(deadline.id, deadline);
    }
    return Array.from(byId.values()).sort((a, b) =>
      (a.deadline ?? "").localeCompare(b.deadline ?? "")
    );
  }, [households]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return households.filter((household) => {
      if (groupFilter && household.group_tag !== groupFilter) {
        return false;
      }
      if (deadlineFilter && rsvpDeadline(household)?.id !== deadlineFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        household.display_name,
        ...household.guests.flatMap((g) => [g.first_name, g.last_name]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [households, search, groupFilter, deadlineFilter]);

  const filteredActive = filtered.length !== households.length;
  const anyExpanded = filtered.some((h) => !collapsedIds.has(h.id));

  const toggleHousehold = (householdId: string) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (!next.delete(householdId)) next.add(householdId);
      return next;
    });
  };

  // Both bulk actions apply to the filtered households only, leaving the
  // collapsed state of everything currently filtered out untouched.
  const setAllCollapsed = (collapsed: boolean) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      for (const household of filtered) {
        if (collapsed) next.add(household.id);
        else next.delete(household.id);
      }
      return next;
    });
  };

  const stats = useMemo(() => {
    const guests = filtered.flatMap((h) => h.guests);
    const yes = guests.reduce(
      (sum, g) => sum + g.rsvps.filter((r) => r.attending === "yes").length,
      0
    );
    const invited = guests.reduce((sum, g) => sum + g.guest_events.length, 0);
    const responded = guests.reduce((sum, g) => sum + g.rsvps.length, 0);
    return [
      { label: "Households", value: filtered.length },
      { label: "Guests", value: guests.length },
      { label: "Yes RSVPs", value: yes },
      { label: "Pending RSVPs", value: Math.max(0, invited - responded) },
    ];
  }, [filtered]);

  const eventStats = useMemo(() => {
    const guests = filtered.flatMap((h) => h.guests);
    return events.map((event) => {
      let invited = 0;
      let yes = 0;
      let no = 0;
      for (const guest of guests) {
        if (!guest.guest_events.some((ge) => ge.event_id === event.id)) continue;
        invited += 1;
        const rsvp = guest.rsvps.find((r) => r.event_id === event.id);
        if (rsvp?.attending === "yes") yes += 1;
        else if (rsvp?.attending === "no") no += 1;
      }
      return { id: event.id, name: event.name, invited, yes, no, pending: invited - yes - no };
    });
  }, [filtered, events]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by household or guest name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-full"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="h-8 rounded-full border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All groups</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        {deadlines.length > 1 ? (
          <select
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value)}
            className="h-8 rounded-full border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All RSVP dates</option>
            {deadlines.map((deadline) => (
              <option key={deadline.id} value={deadline.id}>
                {deadlineText(deadline)}
              </option>
            ))}
          </select>
        ) : null}
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {households.length} households
        </span>
        {filtered.length > 0 ? (
          <button
            type="button"
            onClick={() => setAllCollapsed(anyExpanded)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {anyExpanded ? "Collapse all" : "Expand all"}
          </button>
        ) : null}
        {filteredActive ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setGroupFilter("");
              setDeadlineFilter("");
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="av-stat">
            <span className="av-stat-value">{stat.value}</span>
            <span className="av-stat-label">
              {stat.label}
              {filteredActive ? " (filtered)" : ""}
            </span>
          </div>
        ))}
      </div>

      {eventStats.length > 0 ? (
        <div>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-xl">
              RSVPs by event{filteredActive ? " (filtered)" : ""}
            </h2>
            <Link href="/admin/guest-list" className="text-sm font-semibold text-primary">
              Guest list by event &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {eventStats.map((event) => (
              <Link
                key={event.id}
                href={`/admin/guest-list?event=${event.id}`}
                className="av-event-stat"
              >
                <span className="av-event-stat-name">{event.name}</span>
                <div className="av-event-stat-main">
                  <strong>{event.yes}</strong>
                  <span>of {event.invited} yes</span>
                </div>
                <div className="av-event-stat-breakdown">
                  <span>
                    <span className="av-no">{event.no}</span> no
                  </span>
                  <span>
                    <span className="av-pending">{event.pending}</span> pending
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-5 font-heading text-xl">Households</h2>
        <HouseholdsTable
          households={filtered}
          collapsedIds={collapsedIds}
          onToggle={toggleHousehold}
        />
      </div>
    </>
  );
}
