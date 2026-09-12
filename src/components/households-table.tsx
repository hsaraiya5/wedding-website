"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EditInvitationsDialog } from "@/components/edit-invitations-dialog";

type EventRef = { name: string } | { name: string }[] | null;

type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  guest_events: { event_id: string; events: EventRef }[];
  rsvps: { event_id: string; attending: "yes" | "no" | null }[];
};

type Event = { id: string; name: string; event_date: string | null };

type Household = {
  id: string;
  display_name: string;
  code: string;
  group_tag: string | null;
  guests: Guest[];
};

function eventList(guest: Guest): { name: string; status: string }[] {
  const rsvpByEvent = new Map(guest.rsvps.map((r) => [r.event_id, r.attending]));
  return guest.guest_events.flatMap((ge) => {
    const events = Array.isArray(ge.events) ? ge.events : ge.events ? [ge.events] : [];
    return events.map((event) => {
      const attending = rsvpByEvent.get(ge.event_id);
      const status = attending === "yes" ? "Yes" : attending === "no" ? "No" : "Pending";
      return { name: event.name, status };
    });
  });
}

export function HouseholdsTable({
  households,
  events,
}: {
  households: Household[];
  events: Event[];
}) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  const groups = useMemo(() => {
    const set = new Set(households.map((h) => h.group_tag).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [households]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return households.filter((household) => {
      if (groupFilter && household.group_tag !== groupFilter) {
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
  }, [households, search, groupFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by household or guest name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">All groups</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {households.length}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Household</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Guests, invited events &amp; RSVP status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((household) => (
            <TableRow key={household.id}>
              <TableCell className="font-medium">
                <Link href={`/admin/households/${household.id}`} className="hover:underline">
                  {household.display_name}
                </Link>
              </TableCell>
              <TableCell>
                {household.group_tag ? <Badge variant="secondary">{household.group_tag}</Badge> : null}
              </TableCell>
              <TableCell>
                <code>{household.code}</code>
              </TableCell>
              <TableCell className="text-sm">
                <div className="flex flex-col gap-1">
                  {household.guests.map((guest) => {
                    const guestEventList = eventList(guest);
                    return (
                      <div key={guest.id}>
                        <span className="font-medium">{guest.first_name}:</span>{" "}
                        {guestEventList.length > 0
                          ? guestEventList.map((e, i) => (
                              <span key={i}>
                                {i > 0 ? ", " : ""}
                                {e.name} ({e.status})
                              </span>
                            ))
                          : "no invited events"}
                      </div>
                    );
                  })}
                </div>
              </TableCell>
              <TableCell>
                <EditInvitationsDialog
                  householdId={household.id}
                  householdName={household.display_name}
                  events={events}
                  guests={household.guests.map((guest) => ({
                    id: guest.id,
                    first_name: guest.first_name,
                    last_name: guest.last_name,
                    invitedEventIds: guest.guest_events.map((ge) => ge.event_id),
                  }))}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
