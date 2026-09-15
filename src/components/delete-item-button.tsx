"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Generic confirm-then-delete button for the small admin-managed lists
// (travel options, FAQs) -- same shape as DeleteHouseholdButton, just
// parameterized over which delete action and confirm copy to use.
//
// deleteAction must be the actual "use server" function reference, not a
// closure wrapping it (e.g. not `() => deleteTravelOption(id)`) -- a Server
// Component can only pass a direct reference to a server action across the
// client boundary, since that's the only kind of function React knows how
// to serialize. id is passed separately and applied here instead.
export function DeleteItemButton({
  deleteAction,
  id,
  confirmMessage,
  label = "Delete",
}: {
  deleteAction: (id: string) => Promise<void>;
  id: string;
  confirmMessage: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      await deleteAction(id);
      router.refresh();
    });
  };

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
      {pending ? "Deleting..." : label}
    </Button>
  );
}
