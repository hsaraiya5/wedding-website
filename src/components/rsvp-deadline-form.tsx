"use client";

import { useActionState, useRef, useEffect } from "react";
import { saveRsvpDeadline } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RsvpDeadlineForm() {
  const [state, formAction, pending] = useActionState(saveRsvpDeadline, { error: null });
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="av-field">
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" placeholder="e.g. Immediate family" required />
      </div>
      <div className="av-field">
        <Label htmlFor="deadline">Date (optional)</Label>
        <Input id="deadline" name="deadline" type="date" />
      </div>
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? "Saving..." : "Add date"}
      </Button>
      {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
