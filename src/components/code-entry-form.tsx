"use client";

import { useActionState } from "react";
import { redeemInviteCode } from "@/app/actions/guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CodeEntryForm() {
  const [state, formAction, pending] = useActionState(redeemInviteCode, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Invite code</Label>
        <Input id="code" name="code" placeholder="e.g. janedoe" autoComplete="off" />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Checking..." : "Continue"}
      </Button>
    </form>
  );
}
