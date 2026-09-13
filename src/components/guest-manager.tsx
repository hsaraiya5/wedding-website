"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGuest, deleteGuest } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvitationsForm } from "@/components/invitations-form";

type Guest = { id: string; first_name: string; last_name: string };
type Event = { id: string; name: string; event_date: string | null };

function initials(first: string, last: string) {
  return (first[0] ?? "") + (last[0] ?? "");
}

function GuestRow({
  guest,
  householdId,
  events,
  invitedEventIds,
}: {
  guest: Guest;
  householdId: string;
  events: Event[];
  invitedEventIds: string[];
}) {
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
    <div className="av-guest-block">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="guest_id" value={guest.id} />
        <input type="hidden" name="household_id" value={householdId} />
        <div className="flex items-center gap-2">
          <span className="av-avatar">{initials(guest.first_name, guest.last_name)}</span>
          <Input name="first_name" defaultValue={guest.first_name} placeholder="First name" required />
          <Input name="last_name" defaultValue={guest.last_name} placeholder="Last name" required />
          <Button type="submit" variant="outline" size="sm" className="rounded-full" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="rounded-full"
            onClick={handleDelete}
            disabled={deleting}
          >
            Remove
          </Button>
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      </form>

      <div>
        <p className="av-section-hint mb-2 font-medium">Invited events</p>
        <InvitationsForm
          guestId={guest.id}
          householdId={householdId}
          events={events}
          invitedEventIds={invitedEventIds}
        />
      </div>
    </div>
  );
}

// Server Actions invoked via a <form action={...}> trigger an automatic
// refresh of the current route once revalidatePath resolves inside the
// action, so the parent's `guests` prop -- and this key -- naturally
// updates after a successful add, remounting the form with blank inputs
// (including the selected-events state below).
function AddGuestForm({
  householdId,
  events,
  resetKey,
}: {
  householdId: string;
  events: Event[];
  resetKey: number;
}) {
  const [state, formAction, pending] = useActionState(saveGuest, { error: null });
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  return (
    <form key={resetKey} action={formAction} className="av-guest-block border-dashed">
      <input type="hidden" name="household_id" value={householdId} />
      <input type="hidden" name="event_ids" value={JSON.stringify(Array.from(selectedEvents))} />
      <div className="flex items-center gap-2">
        <Input name="first_name" placeholder="First name" required />
        <Input name="last_name" placeholder="Last name" required />
      </div>

      {events.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="av-section-hint font-medium">Invited events</p>
          <div className="flex flex-wrap gap-2">
            {events.map((event) => {
              const pressed = selectedEvents.has(event.id);
              return (
                <button
                  key={event.id}
                  type="button"
                  aria-pressed={pressed}
                  className="av-toggle"
                  onClick={() => toggleEvent(event.id)}
                >
                  {event.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending || selectedEvents.size === 0} className="self-start rounded-full">
        {pending ? "Adding..." : "Add guest"}
      </Button>
    </form>
  );
}

export function GuestManager({
  householdId,
  guests,
  events,
  guestEvents,
}: {
  householdId: string;
  guests: Guest[];
  events: Event[];
  guestEvents: { guest_id: string; event_id: string }[];
}) {
  const invitedEventIdsByGuest = (guestId: string) =>
    guestEvents.filter((ge) => ge.guest_id === guestId).map((ge) => ge.event_id);

  return (
    <div className="flex flex-col gap-4">
      {guests.length > 0 ? (
        <div className="flex flex-col gap-4">
          {guests.map((guest) => (
            <GuestRow
              key={guest.id}
              guest={guest}
              householdId={householdId}
              events={events}
              invitedEventIds={invitedEventIdsByGuest(guest.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No guests yet.</p>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Add a guest</p>
        <AddGuestForm householdId={householdId} events={events} resetKey={guests.length} />
      </div>
    </div>
  );
}
