"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { submitRsvp } from "@/app/actions/rsvp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatEventDay, formatEventTime } from "@/lib/format";

type Household = {
  id: string;
  display_name: string;
  rsvp_submitted_at: string | null;
  song_request: string | null;
};

type Guest = { id: string; first_name: string; last_name: string };

type Event = {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
};

type GuestEvent = { guest_id: string; event_id: string };

type Rsvp = { guest_id: string; event_id: string; attending: "yes" | "no" | null };

type SiteSettings = {
  rsvp_deadline: string | null;
  late_edits_enabled: boolean;
} | null;

function answerKey(guestId: string, eventId: string) {
  return `${guestId}:${eventId}`;
}

export function RsvpForm({
  household,
  guests,
  events,
  guestEvents,
  existingRsvps,
  siteSettings,
  justSubmitted,
}: {
  household: Household;
  guests: Guest[];
  events: Event[];
  guestEvents: GuestEvent[];
  existingRsvps: Rsvp[];
  siteSettings: SiteSettings;
  justSubmitted: boolean;
}) {
  const alreadySubmitted = household.rsvp_submitted_at !== null;
  const deadline = siteSettings?.rsvp_deadline ? new Date(siteSettings.rsvp_deadline) : null;
  const deadlinePassed = deadline ? new Date() > deadline : false;
  const canEdit = !deadlinePassed || Boolean(siteSettings?.late_edits_enabled);

  const invitedSet = useMemo(
    () => new Set(guestEvents.map((ge) => answerKey(ge.guest_id, ge.event_id))),
    [guestEvents]
  );
  const isInvited = (guestId: string, eventId: string) => invitedSet.has(answerKey(guestId, eventId));

  // Only guests with something to answer for get a spot in the carousel.
  const rsvpGuests = useMemo(
    () => guests.filter((guest) => events.some((event) => isInvited(guest.id, event.id))),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isInvited is derived from guestEvents, already a dep
    [guests, events, guestEvents]
  );

  const [mode, setMode] = useState<"readonly" | "edit">(
    alreadySubmitted ? "readonly" : "edit"
  );
  const [activeGuestIndex, setActiveGuestIndex] = useState(0);

  const initialAnswers = useMemo(() => {
    const map: Record<string, "yes" | "no"> = {};
    for (const rsvp of existingRsvps) {
      if (rsvp.attending) {
        map[answerKey(rsvp.guest_id, rsvp.event_id)] = rsvp.attending;
      }
    }
    return map;
  }, [existingRsvps]);

  const [answers, setAnswers] = useState(initialAnswers);
  const [songRequest, setSongRequest] = useState(household.song_request ?? "");

  const [state, formAction, pending] = useActionState(submitRsvp, { error: null });

  const answersArray = events.flatMap((event) =>
    guests
      .filter((guest) => answers[answerKey(guest.id, event.id)])
      .map((guest) => ({
        guest_id: guest.id,
        event_id: event.id,
        attending: answers[answerKey(guest.id, event.id)],
      }))
  );

  const activeGuest = rsvpGuests[activeGuestIndex];

  return (
    <div className="flex flex-col gap-4">
      {deadline ? (
        <p className="text-sm text-muted-foreground">
          Please reply by {deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      ) : null}

      {deadlinePassed && !siteSettings?.late_edits_enabled ? (
        <Alert variant="destructive">
          <AlertTitle>RSVP closed</AlertTitle>
          <AlertDescription>
            The deadline to RSVP has passed. Reach out directly if anything needs to change.
          </AlertDescription>
        </Alert>
      ) : null}

      {justSubmitted ? (
        <Alert>
          <AlertTitle>Stamped and received.</AlertTitle>
          <AlertDescription>Your RSVP has been recorded.</AlertDescription>
        </Alert>
      ) : null}

      {mode === "readonly" ? (
        <Card>
          <CardHeader>
            <CardTitle>Your answers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {events.map((event) => (
              <div key={event.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{event.name}</p>
                  <span className="text-sm text-muted-foreground">
                    {formatEventDay(event.event_date)} &middot; {formatEventTime(event.start_time)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guests
                    .filter((guest) => isInvited(guest.id, event.id))
                    .map((guest) => {
                      const answer = answers[answerKey(guest.id, event.id)];
                      return (
                        <Badge key={guest.id} variant={answer === "yes" ? "default" : "secondary"}>
                          {guest.first_name}: {answer === "yes" ? "Yes" : answer === "no" ? "No" : "Not answered"}
                        </Badge>
                      );
                    })}
                </div>
              </div>
            ))}

            {household.song_request ? (
              <div>
                <p className="text-sm font-medium">Song request</p>
                <p className="text-sm text-muted-foreground">{household.song_request}</p>
              </div>
            ) : null}

            {canEdit ? (
              <Button variant="outline" onClick={() => setMode("edit")} className="self-start">
                Make Changes
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <form action={formAction} className="flex flex-col gap-6">
          <input type="hidden" name="answers" value={JSON.stringify(answersArray)} />

          {rsvpGuests.length > 0 ? (
            <Card>
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <strong className="text-sm">
                    Guest {activeGuestIndex + 1} of {rsvpGuests.length}
                  </strong>
                  <div className="flex gap-1.5" role="tablist" aria-label="Choose a guest">
                    {rsvpGuests.map((guest, index) => (
                      <button
                        key={guest.id}
                        type="button"
                        role="tab"
                        aria-selected={index === activeGuestIndex}
                        aria-label={`${guest.first_name} ${guest.last_name}`}
                        onClick={() => setActiveGuestIndex(index)}
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full border text-sm",
                          index === activeGuestIndex
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {activeGuest ? (
                  <div className="flex flex-col gap-4">
                    <h3 className="font-heading text-xl">
                      {activeGuest.first_name} {activeGuest.last_name}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {events
                        .filter((event) => isInvited(activeGuest.id, event.id))
                        .map((event) => {
                          const key = answerKey(activeGuest.id, event.id);
                          const value = answers[key];
                          return (
                            <div
                              key={event.id}
                              className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3"
                            >
                              <strong className="text-sm">{event.name}</strong>
                              <span className="text-xs text-muted-foreground">
                                {formatEventDay(event.event_date)} &middot; {formatEventTime(event.start_time)}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAnswers((prev) => ({ ...prev, [key]: "yes" }))
                                  }
                                  aria-pressed={value === "yes"}
                                  className={cn(
                                    "flex-1 rounded border px-3 py-1.5 text-sm font-semibold transition-colors",
                                    value === "yes"
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:bg-muted"
                                  )}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAnswers((prev) => ({ ...prev, [key]: "no" }))
                                  }
                                  aria-pressed={value === "no"}
                                  className={cn(
                                    "flex-1 rounded border px-3 py-1.5 text-sm font-semibold transition-colors",
                                    value === "no"
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:bg-muted"
                                  )}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={activeGuestIndex === 0}
                    onClick={() => setActiveGuestIndex((i) => Math.max(0, i - 1))}
                  >
                    &larr; Previous guest
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={activeGuestIndex === rsvpGuests.length - 1}
                    onClick={() =>
                      setActiveGuestIndex((i) => Math.min(rsvpGuests.length - 1, i + 1))
                    }
                  >
                    Next guest &rarr;
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">No events found for your household.</p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="song_request">Song request (optional)</Label>
            <Textarea
              id="song_request"
              name="song_request"
              value={songRequest}
              onChange={(event) => setSongRequest(event.target.value)}
              placeholder="Song title and artist"
            />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting..." : "Stamp our RSVP"}
            </Button>
            {alreadySubmitted ? (
              <Button type="button" variant="outline" onClick={() => setMode("readonly")}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
