"use client";

import { useActionState, useEffect } from "react";
import { redeemInviteCode } from "@/app/actions/guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CodeEntryForm() {
  const [state, formAction, pending] = useActionState(redeemInviteCode, {
    error: null,
  });

  // If the browser restores this page from its back/forward cache (e.g.
  // after redeeming a code, then hitting Back), the restored snapshot can
  // carry a stale "pending" state from a submission that never resolved
  // (redirect() navigates away before the action settles). Force a real
  // reload in that case so the form always starts fresh.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

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
