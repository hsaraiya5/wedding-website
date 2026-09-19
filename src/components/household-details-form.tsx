"use client";

import { useActionState, useState } from "react";
import { saveHousehold } from "@/app/actions/admin";
import { GROUP_TAGS } from "@/lib/group-tags";
import { formatRsvpDeadlineDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Household = {
  id: string;
  display_name: string;
  code: string;
  group_tag: string | null;
  rsvp_deadline_id: string;
  hotel_covered_by_host: boolean;
} | null;

type Event = { id: string; name: string; event_date: string | null };

type RsvpDeadline = { id: string; label: string; deadline: string | null };

type NewGuest = { first_name: string; last_name: string; event_ids: string[] };

export function HouseholdDetailsForm({
  household,
  events = [],
  rsvpDeadlines = [],
}: {
  household: Household;
  events?: Event[];
  rsvpDeadlines?: RsvpDeadline[];
}) {
  const [state, formAction, pending] = useActionState(saveHousehold, { error: null });

  // Only relevant when creating -- a household needs at least one guest to
  // ever be useful to whoever redeems its code, so guests (and which
  // events each is invited to) are collected here and created atomically
  // with the household itself.
  const [newGuests, setNewGuests] = useState<NewGuest[]>([
    { first_name: "", last_name: "", event_ids: [] },
  ]);

  const updateGuest = (index: number, field: "first_name" | "last_name", value: string) => {
    setNewGuests((prev) =>
      prev.map((guest, i) => (i === index ? { ...guest, [field]: value } : guest))
    );
  };

  const toggleGuestEvent = (index: number, eventId: string) => {
    setNewGuests((prev) =>
      prev.map((guest, i) => {
        if (i !== index) return guest;
        const has = guest.event_ids.includes(eventId);
        return {
          ...guest,
          event_ids: has
            ? guest.event_ids.filter((id) => id !== eventId)
            : [...guest.event_ids, eventId],
        };
      })
    );
  };

  const addGuestRow = () =>
    setNewGuests((prev) => [...prev, { first_name: "", last_name: "", event_ids: [] }]);
  const removeGuestRow = (index: number) =>
    setNewGuests((prev) => prev.filter((_, i) => i !== index));

  const validGuests = newGuests.filter((g) => g.first_name.trim() && g.last_name.trim());

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {household ? (
        <input type="hidden" name="household_id" value={household.id} />
      ) : (
        <input type="hidden" name="guests" value={JSON.stringify(validGuests)} />
      )}

      <div className="av-field">
        <Label htmlFor="display_name">Household name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={household?.display_name}
          placeholder="e.g. The Smith Family"
          required
        />
        <p className="av-section-hint">
          This is what the guest sees when they log in -- e.g. &ldquo;Welcome, {household?.display_name || "Smith Family"}&rdquo;. Use whatever name they&apos;d recognize themselves by.
        </p>
      </div>

      <div className="av-field">
        <Label htmlFor="rsvp_deadline_id">RSVP date</Label>
        <Select name="rsvp_deadline_id" defaultValue={household?.rsvp_deadline_id ?? undefined} required>
          <SelectTrigger id="rsvp_deadline_id" className="w-full">
            <SelectValue placeholder="Select an RSVP date">
              {(value: string | null) => {
                const rd = rsvpDeadlines.find((d) => d.id === value);
                if (!rd) return "Select an RSVP date";
                return rd.deadline ? `${rd.label} (${formatRsvpDeadlineDate(rd.deadline)})` : rd.label;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {rsvpDeadlines.map((rd) => (
              <SelectItem key={rd.id} value={rd.id}>
                {rd.label}
                {rd.deadline ? ` (${formatRsvpDeadlineDate(rd.deadline)})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {rsvpDeadlines.length === 0 ? (
          <p className="av-section-hint">
            No RSVP dates yet -- add one on the <a href="/admin/rsvp-dates">RSVP dates</a> page first.
          </p>
        ) : null}
      </div>

      <label htmlFor="hotel_covered_by_host" className="flex items-start gap-2.5">
        <input
          id="hotel_covered_by_host"
          name="hotel_covered_by_host"
          type="checkbox"
          className="mt-1"
          defaultChecked={household?.hotel_covered_by_host ?? false}
        />
        <span className="flex flex-col">
          <span className="text-sm font-medium">Host is covering this household&apos;s hotel stay</span>
          <span className="av-section-hint">
            The guest won&apos;t see hotel block info on their page -- they&apos;ll see a note to
            contact the hosts for their reservation details instead.
          </span>
        </span>
      </label>

      {!household ? (
        <div className="av-field">
          <Label htmlFor="code">Invite code</Label>
          <Input id="code" name="code" placeholder="Leave blank to auto-generate" />
        </div>
      ) : null}

      <div className="av-field">
        <Label htmlFor="group_tag">Group</Label>
        <Select name="group_tag" defaultValue={household?.group_tag ?? undefined} required>
          <SelectTrigger id="group_tag" className="w-full">
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent>
            {GROUP_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!household ? (
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <div className="av-field">
            <Label>Guests</Label>
            <p className="av-section-hint">
              At least one guest is required -- otherwise the family sees an empty page when they use their code.
            </p>
          </div>
          {newGuests.map((guest, index) => (
            <div key={index} className="av-guest-block">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="First name"
                  value={guest.first_name}
                  onChange={(e) => updateGuest(index, "first_name", e.target.value)}
                />
                <Input
                  placeholder="Last name"
                  value={guest.last_name}
                  onChange={(e) => updateGuest(index, "last_name", e.target.value)}
                />
                {newGuests.length > 1 ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-full"
                    onClick={() => removeGuestRow(index)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>

              {events.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="av-section-hint font-medium">Invited events</p>
                  <div className="flex flex-wrap gap-2">
                    {events.map((event) => {
                      const pressed = guest.event_ids.includes(event.id);
                      return (
                        <button
                          key={event.id}
                          type="button"
                          aria-pressed={pressed}
                          className="av-toggle"
                          onClick={() => toggleGuestEvent(index, event.id)}
                        >
                          {event.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start rounded-full"
            onClick={addGuestRow}
          >
            Add another guest
          </Button>
        </div>
      ) : null}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button
        type="submit"
        disabled={pending || (!household && validGuests.length === 0)}
        className="self-start rounded-full"
      >
        {pending ? "Saving..." : household ? "Save changes" : "Create household"}
      </Button>
    </form>
  );
}
