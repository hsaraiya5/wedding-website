"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveInvitations } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Event = { id: string; name: string; event_date: string | null };

export function InvitationsForm({
  householdId,
  events,
  invitedEventIds,
}: {
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
        await saveInvitations(householdId, Array.from(selected));
        router.refresh();
      } catch {
        setError("Something went wrong saving invitations.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => (
        <div key={event.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`event-${event.id}`}
            checked={selected.has(event.id)}
            onChange={() => toggle(event.id)}
            className="size-4"
          />
          <Label htmlFor={`event-${event.id}`}>
            {event.name} <span className="text-muted-foreground">({event.event_date})</span>
          </Label>
        </div>
      ))}
      <Button type="button" onClick={handleSave} disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save invitations"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
