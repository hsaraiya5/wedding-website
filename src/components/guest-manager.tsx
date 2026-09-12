"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGuest, deleteGuest } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Guest = { id: string; first_name: string; last_name: string };

function GuestRow({ guest, householdId }: { guest: Guest; householdId: string }) {
  const [state, formAction, pending] = useActionState(saveGuest, { error: null });
  const router = useRouter();
  const [deleting, startDeleteTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Remove ${guest.first_name} ${guest.last_name}?`)) return;
    startDeleteTransition(async () => {
      await deleteGuest(guest.id, householdId);
      router.refresh();
    });
  };

  return (
    <form action={formAction} className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0">
      <input type="hidden" name="guest_id" value={guest.id} />
      <input type="hidden" name="household_id" value={householdId} />
      <div className="flex items-center gap-2">
        <Input name="first_name" defaultValue={guest.first_name} placeholder="First name" required />
        <Input name="last_name" defaultValue={guest.last_name} placeholder="Last name" required />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          Remove
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}

// Server Actions invoked via a <form action={...}> trigger an automatic
// refresh of the current route once revalidatePath resolves inside the
// action, so the parent's `guests` prop -- and this key -- naturally
// updates after a successful add, remounting the form with blank inputs.
function AddGuestForm({ householdId, resetKey }: { householdId: string; resetKey: number }) {
  const [state, formAction, pending] = useActionState(saveGuest, { error: null });

  return (
    <form key={resetKey} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="household_id" value={householdId} />
      <div className="flex items-center gap-2">
        <Input name="first_name" placeholder="First name" required />
        <Input name="last_name" placeholder="Last name" required />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding..." : "Add guest"}
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}

export function GuestManager({
  householdId,
  guests,
}: {
  householdId: string;
  guests: Guest[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {guests.length > 0 ? (
        <div className="flex flex-col gap-3">
          {guests.map((guest) => (
            <GuestRow key={guest.id} guest={guest} householdId={householdId} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No guests yet.</p>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Add a guest</p>
        <AddGuestForm householdId={householdId} resetKey={guests.length} />
      </div>
    </div>
  );
}
