"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { submitRsvp } from "@/app/actions/rsvp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  existingRsvps,
  siteSettings,
  justSubmitted,
}: {
  household: Household;
  guests: Guest[];
  events: Event[];
  existingRsvps: Rsvp[];
  siteSettings: SiteSettings;
  justSubmitted: boolean;
}) {
  const alreadySubmitted = household.rsvp_submitted_at !== null;
  const deadline = siteSettings?.rsvp_deadline ? new Date(siteSettings.rsvp_deadline) : null;
  const deadlinePassed = deadline ? new Date() > deadline : false;
  const canEdit = !deadlinePassed || Boolean(siteSettings?.late_edits_enabled);

  const [mode, setMode] = useState<"readonly" | "edit">(
    alreadySubmitted ? "readonly" : "edit"
  );

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

  return (
    <div className="flex flex-col gap-4">
      {deadline ? (
        <p className="text-sm text-muted-foreground">
          RSVP by {deadline.toLocaleDateString()} {deadline.toLocaleTimeString()}
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
          <AlertTitle>Thanks!</AlertTitle>
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
                    {event.event_date} &middot; {event.start_time}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guests.map((guest) => {
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

          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{event.name}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {event.event_date} &middot; {event.start_time}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {guests.map((guest) => {
                  const key = answerKey(guest.id, event.id);
                  return (
                    <div key={guest.id} className="flex items-center justify-between gap-4">
                      <Label>{guest.first_name} {guest.last_name}</Label>
                      <RadioGroup
                        value={answers[key] ?? ""}
                        onValueChange={(value) =>
                          setAnswers((prev) => ({ ...prev, [key]: value as "yes" | "no" }))
                        }
                        className="flex flex-row gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="yes" id={`${key}-yes`} />
                          <Label htmlFor={`${key}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id={`${key}-no`} />
                          <Label htmlFor={`${key}-no`}>No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          <div className="flex flex-col gap-2">
            <Label htmlFor="song_request">Song request (optional)</Label>
            <Textarea
              id="song_request"
              name="song_request"
              value={songRequest}
              onChange={(event) => setSongRequest(event.target.value)}
              placeholder="Any song that'll get you on the dance floor"
            />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting..." : "Submit RSVP"}
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
