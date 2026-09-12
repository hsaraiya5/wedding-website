"use client";

import { useTransition } from "react";
import { deleteHousehold } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function DeleteHouseholdButton({
  householdId,
  displayName,
}: {
  householdId: string;
  displayName: string;
}) {
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete ${displayName} and all of their guests/RSVPs? This can't be undone.`)) {
      return;
    }
    startTransition(() => {
      deleteHousehold(householdId);
    });
  };

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
      {pending ? "Deleting..." : "Delete household"}
    </Button>
  );
}
