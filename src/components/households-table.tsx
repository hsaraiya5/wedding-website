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

type Guest = {
  first_name: string;
  last_name: string;
  guest_events: { events: { name: string } | { name: string }[] | null }[];
};

type Household = {
  id: string;
  display_name: string;
  code: string;
  group_tag: string | null;
  guests: Guest[];
};

function eventNamesFor(guest: Guest): string {
  return guest.guest_events
    .flatMap((ge) => (Array.isArray(ge.events) ? ge.events : ge.events ? [ge.events] : []))
    .map((e) => e.name)
    .filter(Boolean)
    .join(", ");
}

export function HouseholdsTable({ households }: { households: Household[] }) {
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
            <TableHead>Guests &amp; invited events</TableHead>
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
                {household.guests
                  .map((guest) => `${guest.first_name}: ${eventNamesFor(guest) || "none"}`)
                  .join("; ")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
