"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DeleteHouseholdButton } from "@/components/delete-household-button";
import { formatRsvpDeadlineDate, guestFullName } from "@/lib/format";
import { cn } from "@/lib/utils";

type EventInfo = { name: string; event_date?: string | null; start_time?: string | null };
export type EventRef = EventInfo | EventInfo[] | null;

export type Guest = {
  id: string;
  first_name: string;
  last_name: string | null;
  guest_events: { event_id: string; events: EventRef }[];
  rsvps: { event_id: string; attending: "yes" | "no" | null }[];
};

export type WhatsappNumber = { phone_number: string };

export type RsvpDeadline = { id: string; label: string; deadline: string | null };

export type Household = {
  id: string;
  display_name: string;
  code: string;
  group_tag: string | null;
  // Assigned per household (NOT NULL in the schema), so every guest inside
  // inherits it -- shown once on the card rather than repeated per guest.
  rsvp_deadlines: RsvpDeadline | RsvpDeadline[] | null;
  household_whatsapp_numbers: WhatsappNumber[];
  // We're paying for their room; the guest site swaps the hotel cards for a
  // "your stay is covered" note.
  hotel_covered_by_host: boolean;
  dietary_needs: string | null;
  accessibility_needs: string | null;
  guests: Guest[];
};

// In the order they happen (Haldi, Sangeet, Vivaha, Reception) -- the
// embedded rows come back in no particular order.
function eventList(guest: Guest): { name: string; status: "yes" | "no" | "pending" }[] {
  const rsvpByEvent = new Map(guest.rsvps.map((r) => [r.event_id, r.attending]));
  return guest.guest_events
    .flatMap((ge) => {
      const events = Array.isArray(ge.events) ? ge.events : ge.events ? [ge.events] : [];
      return events.map((event) => {
        const attending = rsvpByEvent.get(ge.event_id);
        const status = attending === "yes" ? "yes" : attending === "no" ? "no" : "pending";
        const when = `${event.event_date ?? "9999-12-31"} ${event.start_time ?? "99:99"}`;
        return { name: event.name, status: status as "yes" | "no" | "pending", when };
      });
    })
    .sort((a, b) => a.when.localeCompare(b.when))
    .map(({ name, status }) => ({ name, status }));
}

export function rsvpDeadline(household: Household): RsvpDeadline | null {
  if (Array.isArray(household.rsvp_deadlines)) return household.rsvp_deadlines[0] ?? null;
  return household.rsvp_deadlines;
}

export function deadlineText(deadline: RsvpDeadline): string {
  return deadline.deadline ? formatRsvpDeadlineDate(deadline.deadline) : deadline.label;
}

function responseSummary(household: Household) {
  const invited = household.guests.reduce((sum, g) => sum + g.guest_events.length, 0);
  const answered = household.guests.reduce((sum, g) => sum + g.rsvps.length, 0);
  return { invited, answered, complete: invited > 0 && answered >= invited };
}

export function HouseholdsTable({
  households,
  collapsedIds,
  onToggle,
}: {
  households: Household[];
  // Held by AdminDashboard so the collapse-all / expand-all buttons up with
  // the filters can act on exactly the households being shown.
  collapsedIds: Set<string>;
  onToggle: (householdId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {households.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No households match your search.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {households.map((household) => {
            const summary = responseSummary(household);
            const deadline = rsvpDeadline(household);
            const collapsed = collapsedIds.has(household.id);
            const details = [
              {
                label: "WhatsApp",
                value: household.household_whatsapp_numbers.map((n) => n.phone_number).join(", "),
              },
              { label: "Dietary", value: household.dietary_needs?.trim() ?? "" },
              { label: "Accessibility", value: household.accessibility_needs?.trim() ?? "" },
            ].filter((detail) => detail.value);
            return (
              <div key={household.id} className="av-household-card">
                <div className="av-household-header">
                  <div className="flex flex-1 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onToggle(household.id)}
                      aria-expanded={!collapsed}
                      aria-controls={`household-guests-${household.id}`}
                      aria-label={`${collapsed ? "Show" : "Hide"} guests in ${household.display_name}`}
                      className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ChevronDown
                        className={cn("size-4 transition-transform", collapsed && "-rotate-90")}
                      />
                    </button>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/admin/households/${household.id}`}
                        className="font-heading text-base hover:text-primary"
                      >
                        {household.display_name}
                      </Link>
                      {household.group_tag ? (
                        <span className="av-pill bg-muted text-foreground">
                          {household.group_tag}
                        </span>
                      ) : null}
                      <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        Invite code: {household.code}
                      </code>
                      {summary.invited > 0 ? (
                        <span className={cn("av-response-badge", summary.complete && "av-complete")}>
                          {summary.answered} of {summary.invited} answered
                        </span>
                      ) : null}
                      {deadline ? (
                        <span className="av-pill bg-muted text-foreground">
                          RSVP by {deadlineText(deadline)}
                        </span>
                      ) : null}
                      {household.hotel_covered_by_host ? (
                        <span className="av-pill av-pill-yes">Hotel covered</span>
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

                <div
                  id={`household-guests-${household.id}`}
                  className="av-guest-summary-list"
                  hidden={collapsed}
                >
                  {household.guests.map((guest) => {
                    const guestEventList = eventList(guest);
                    return (
                      <div key={guest.id} className="av-guest-summary-row">
                        <span className="av-guest-summary-name">
                          {guestFullName(guest.first_name, guest.last_name)}
                        </span>
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

                {details.length > 0 ? (
                  <dl className="av-household-details" hidden={collapsed}>
                    {details.map((detail) => (
                      <div key={detail.label} className="contents">
                        <dt>{detail.label}</dt>
                        <dd>{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
