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
} | null;

type NewGuest = { first_name: string; last_name: string };

export function HouseholdDetailsForm({ household }: { household: Household }) {
  const [state, formAction, pending] = useActionState(saveHousehold, { error: null });

  // Only relevant when creating -- a household needs at least one guest to
  // ever be useful to whoever redeems its code, so guests are collected
  // here and created atomically with the household itself.
  const [newGuests, setNewGuests] = useState<NewGuest[]>([{ first_name: "", last_name: "" }]);

  const updateGuest = (index: number, field: keyof NewGuest, value: string) => {
    setNewGuests((prev) =>
      prev.map((guest, i) => (i === index ? { ...guest, [field]: value } : guest))
    );
  };

  const addGuestRow = () => setNewGuests((prev) => [...prev, { first_name: "", last_name: "" }]);
  const removeGuestRow = (index: number) =>
    setNewGuests((prev) => prev.filter((_, i) => i !== index));

  const validGuests = newGuests.filter((g) => g.first_name.trim() && g.last_name.trim());

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {household ? (
        <input type="hidden" name="household_id" value={household.id} />
      ) : (
        <input type="hidden" name="guests" value={JSON.stringify(validGuests)} />
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="display_name">Household name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={household?.display_name}
          placeholder="e.g. The Smith Family"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact_email">Contact email</Label>
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={household?.contact_email ?? ""}
          placeholder="For RSVP confirmations and reminders"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Invite code</Label>
        <Input
          id="code"
          name="code"
          defaultValue={household?.code ?? ""}
          placeholder="Leave blank to auto-generate"
        />
      </div>

      {!household ? (
        <div className="flex flex-col gap-2">
          <Label>Guests</Label>
          <p className="text-xs text-muted-foreground">
            At least one guest is required -- otherwise the family sees an empty page when they use their code.
          </p>
          {newGuests.map((guest, index) => (
            <div key={index} className="flex items-center gap-2">
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
                  onClick={() => removeGuestRow(index)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addGuestRow} className="self-start">
            Add another guest
          </Button>
        </div>
      ) : null}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button
        type="submit"
        disabled={pending || (!household && validGuests.length === 0)}
        className="self-start"
      >
        {pending ? "Saving..." : household ? "Save changes" : "Create household"}
      </Button>
    </form>
  );
}
