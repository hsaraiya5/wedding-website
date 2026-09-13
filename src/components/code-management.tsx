"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateCode, setHouseholdCode } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CodeManagement({
  householdId,
  code,
}: {
  householdId: string;
  code: string;
}) {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState(code);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSaveCode = () => {
    setError(null);
    startTransition(async () => {
      try {
        await setHouseholdCode(householdId, codeInput);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong saving the code.");
      }
    });
  };

  const handleRegenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await regenerateCode(householdId);
        router.refresh();
      } catch {
        setError("Something went wrong regenerating the code.");
      }
    });
  };

  return (
    <div className="av-field">
      <Label htmlFor="household-code">Invite code</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="household-code"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          className="max-w-[220px]"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handleSaveCode}
          disabled={pending || codeInput.trim() === code}
        >
          {pending ? "Saving..." : "Save code"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handleRegenerate}
          disabled={pending}
        >
          {pending ? "Regenerating..." : "Regenerate"}
        </Button>
      </div>
      <p className="av-section-hint">
        Changing or regenerating the code instantly invalidates the old one -- anyone still using it gets signed out.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
