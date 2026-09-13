"use client";

import { useActionState, useState } from "react";
import { saveHousehold } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Household = {
  id: string;
  display_name: string;
  contact_email: string | null;
  code: string;
  group_tag: string | null;
} | null;

type Event = { id: string; name: string; event_date: string | null };

type NewGuest = { first_name: string; last_name: string; event_ids: string[] };

export function HouseholdDetailsForm({
  household,
  existingGroupTags,
  events = [],
}: {
  household: Household;
  existingGroupTags: string[];
  events?: Event[];
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
      </div>

      <div className="av-field">
        <Label htmlFor="contact_email">Contact email</Label>
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={household?.contact_email ?? ""}
          placeholder="For RSVP confirmations and reminders"
        />
      </div>

      {!household ? (
        <div className="av-field">
          <Label htmlFor="code">Invite code</Label>
          <Input id="code" name="code" placeholder="Leave blank to auto-generate" />
        </div>
      ) : null}

      <div className="av-field">
        <Label htmlFor="group_tag">Group</Label>
        <Input
          id="group_tag"
          name="group_tag"
          defaultValue={household?.group_tag ?? ""}
          placeholder="e.g. Saraiya, Manchella, Hrishikesh Friends"
          list="group-tag-suggestions"
        />
        <datalist id="group-tag-suggestions">
          {existingGroupTags.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
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
