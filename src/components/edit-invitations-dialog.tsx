"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvitationsForm } from "@/components/invitations-form";

type Event = { id: string; name: string; event_date: string | null };
type Guest = { id: string; first_name: string; last_name: string; invitedEventIds: string[] };

export function EditInvitationsDialog({
  householdId,
  householdName,
  guests,
  events,
}: {
  householdId: string;
  householdName: string;
  guests: Guest[];
  events: Event[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit invitations
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{householdName} -- invitations</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {guests.map((guest) => (
              <div key={guest.id} className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm font-medium">
                  {guest.first_name} {guest.last_name}
                </p>
                <InvitationsForm
                  guestId={guest.id}
                  householdId={householdId}
                  events={events}
                  invitedEventIds={guest.invitedEventIds}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
