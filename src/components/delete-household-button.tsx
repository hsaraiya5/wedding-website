"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteHousehold } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function DeleteHouseholdButton({
  householdId,
  displayName,
}: {
  householdId: string;
  displayName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete ${displayName} and all of their guests/RSVPs? This can't be undone.`)) {
      return;
    }
    startTransition(async () => {
      await deleteHousehold(householdId);
      // push handles navigating away when this button is used on the
      // deleted household's own edit page; refresh forces a fresh fetch
      // even when already on /admin (the dashboard list), where push to
      // the current route alone wouldn't trigger a re-render.
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
      {pending ? "Deleting..." : "Delete household"}
    </Button>
  );
}
