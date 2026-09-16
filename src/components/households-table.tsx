"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { DeleteHouseholdButton } from "@/components/delete-household-button";
import { cn } from "@/lib/utils";

type EventRef = { name: string } | { name: string }[] | null;

type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  guest_events: { event_id: string; events: EventRef }[];
  rsvps: { event_id: string; attending: "yes" | "no" | null }[];
};

type WhatsappNumber = { phone_number: string; label: string | null };

type Household = {
  id: string;
  display_name: string;
  code: string;
  group_tag: string | null;
  household_whatsapp_numbers: WhatsappNumber[];
  guests: Guest[];
};

function eventList(guest: Guest): { name: string; status: "yes" | "no" | "pending" }[] {
  const rsvpByEvent = new Map(guest.rsvps.map((r) => [r.event_id, r.attending]));
  return guest.guest_events.flatMap((ge) => {
    const events = Array.isArray(ge.events) ? ge.events : ge.events ? [ge.events] : [];
    return events.map((event) => {
      const attending = rsvpByEvent.get(ge.event_id);
      const status = attending === "yes" ? "yes" : attending === "no" ? "no" : "pending";
      return { name: event.name, status: status as "yes" | "no" | "pending" };
    });
  });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function responseSummary(household: Household) {
  const invited = household.guests.reduce((sum, g) => sum + g.guest_events.length, 0);
  const answered = household.guests.reduce((sum, g) => sum + g.rsvps.length, 0);
  return { invited, answered, complete: invited > 0 && answered >= invited };
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
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {households.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No households match your search.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((household) => {
            const summary = responseSummary(household);
            return (
              <div key={household.id} className="av-household-card">
                <div className="av-household-header">
                  <div className="flex flex-1 items-center gap-3">
                    <span className="av-avatar">{initials(household.display_name)}</span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/admin/households/${household.id}`}
                        className="font-heading text-base hover:text-primary"
                      >
                        {household.display_name}
                      </Link>
                      {household.group_tag ? (
                        <span className="av-pill bg-accent text-accent-foreground">
                          {household.group_tag}
                        </span>
                      ) : null}
                      <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {household.code}
                      </code>
                      {summary.invited > 0 ? (
                        <span className={cn("av-response-badge", summary.complete && "av-complete")}>
                          {summary.answered} of {summary.invited} answered
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/admin/households/${household.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" }))}
                    >
                      Edit
                    </Link>
                    <DeleteHouseholdButton householdId={household.id} displayName={household.display_name} />
                  </div>
                </div>

                {household.household_whatsapp_numbers.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    WhatsApp:{" "}
                    {household.household_whatsapp_numbers
                      .map((n) => (n.label ? `${n.phone_number} (${n.label})` : n.phone_number))
                      .join(", ")}
                  </p>
                ) : null}

                <div className="av-guest-summary-list">
                  {household.guests.map((guest) => {
                    const guestEventList = eventList(guest);
                    return (
                      <div key={guest.id} className="av-guest-summary-row">
                        <span className="av-guest-summary-name">{guest.first_name}</span>
                        {guestEventList.length > 0 ? (
                          guestEventList.map((e, i) => (
                            <span
                              key={i}
                              className={cn(
                                "av-pill",
                                e.status === "yes" && "av-pill-yes",
                                e.status === "no" && "av-pill-no",
                                e.status === "pending" && "av-pill-pending"
                              )}
                            >
                              {e.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">no invited events</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
