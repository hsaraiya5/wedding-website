"use client";

import { useActionState, useRef, useEffect } from "react";
import { saveRsvpDeadline } from "@/app/actions/admin";
import { toRsvpDeadlineInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RsvpDeadline = { id: string; label: string; deadline: string | null } | null;

export function RsvpDeadlineForm({ rsvpDeadline = null }: { rsvpDeadline?: RsvpDeadline }) {
  const [state, formAction, pending] = useActionState(saveRsvpDeadline, { error: null });
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error && !rsvpDeadline) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error, rsvpDeadline]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      {rsvpDeadline ? (
        <input type="hidden" name="rsvp_deadline_id" value={rsvpDeadline.id} />
      ) : null}
      <div className="av-field">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          name="label"
          placeholder="e.g. Immediate family"
          defaultValue={rsvpDeadline?.label}
          required
        />
      </div>
      <div className="av-field">
        <Label htmlFor="deadline">Date (optional)</Label>
        <Input
          id="deadline"
          name="deadline"
          type="date"
          defaultValue={
            rsvpDeadline?.deadline ? toRsvpDeadlineInputValue(rsvpDeadline.deadline) : undefined
          }
        />
      </div>
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? "Saving..." : rsvpDeadline ? "Save" : "Add date"}
      </Button>
      {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
