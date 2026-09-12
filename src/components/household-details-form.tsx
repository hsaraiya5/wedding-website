"use client";

import { useActionState } from "react";
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

export function HouseholdDetailsForm({ household }: { household: Household }) {
  const [state, formAction, pending] = useActionState(saveHousehold, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {household ? (
        <input type="hidden" name="household_id" value={household.id} />
      ) : null}

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

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : household ? "Save changes" : "Create household"}
      </Button>
    </form>
  );
}
