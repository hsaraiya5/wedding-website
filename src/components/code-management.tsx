"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateCode } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function CodeManagement({
  householdId,
  code,
}: {
  householdId: string;
  code: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <code className="rounded bg-muted px-2 py-1 text-sm">{code}</code>
        <Button type="button" variant="outline" size="sm" onClick={handleRegenerate} disabled={pending}>
          {pending ? "Regenerating..." : "Regenerate code"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Regenerating instantly invalidates the old code -- anyone still using it gets signed out.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
