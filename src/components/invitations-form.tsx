"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGuestInvitations } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

type Event = { id: string; name: string; event_date: string | null };

// Per-guest invitations -- not every guest in a household is necessarily
// invited to every event (e.g. kids skipping a late-night event).
export function InvitationsForm({
  guestId,
  householdId,
  events,
  invitedEventIds,
}: {
  guestId: string;
  householdId: string;
  events: Event[];
  invitedEventIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(invitedEventIds));
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (eventId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await saveGuestInvitations(guestId, householdId, Array.from(selected));
        router.refresh();
      } catch {
        setError("Something went wrong saving invitations.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {events.map((event) => {
          const pressed = selected.has(event.id);
          return (
            <button
              key={event.id}
              type="button"
              aria-pressed={pressed}
              className="av-toggle"
              onClick={() => toggle(event.id)}
            >
              {event.name}
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={pending}
        className="self-start rounded-full"
      >
        {pending ? "Saving..." : "Save invitations"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
