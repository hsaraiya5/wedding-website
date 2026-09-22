"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { submitRsvp } from "@/app/actions/rsvp";
import { Section } from "@/components/section";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatEventDay, formatEventTime, formatRsvpDeadlineDate } from "@/lib/format";
import "./rsvp-section.css";
import "./site-button.css";

type Household = {
  id: string;
  display_name: string;
  rsvp_submitted_at: string | null;
  dietary_needs: string | null;
  accessibility_needs: string | null;
  household_note: string | null;
  rsvp_deadline: string | null;
  hotel_covered_by_host: boolean;
};

type WhatsappNumber = { id: string; phone_number: string };

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
  late_edits_enabled: boolean;
} | null;

function answerKey(guestId: string, eventId: string) {
  return `${guestId}:${eventId}`;
}

const petalConfigs = [
  { x: "-170px", y: "-92px", r: "-95deg", color: "var(--color-event-ceremony)", delay: "0ms" },
  { x: "-122px", y: "114px", r: "-34deg", color: "var(--color-event-haldi)", delay: "35ms" },
  { x: "-48px", y: "-142px", r: "22deg", color: "var(--color-event-reception)", delay: "70ms" },
  { x: "72px", y: "-142px", r: "58deg", color: "var(--primary)", delay: "20ms" },
  { x: "154px", y: "-70px", r: "106deg", color: "var(--color-event-haldi)", delay: "90ms" },
  { x: "168px", y: "76px", r: "138deg", color: "var(--color-event-ceremony)", delay: "55ms" },
  { x: "68px", y: "142px", r: "188deg", color: "var(--color-event-reception)", delay: "110ms" },
  { x: "-156px", y: "42px", r: "242deg", color: "var(--primary)", delay: "75ms" },
];

export function RsvpForm({
  household,
  guests,
  events,
  guestEvents,
  existingRsvps,
  siteSettings,
  whatsappNumbers,
  justSubmitted,
}: {
  household: Household;
  guests: Guest[];
  events: Event[];
  guestEvents: GuestEvent[];
  existingRsvps: Rsvp[];
  siteSettings: SiteSettings;
  whatsappNumbers: WhatsappNumber[];
  justSubmitted: boolean;
}) {
  const alreadySubmitted = household.rsvp_submitted_at !== null;
  const deadline = household.rsvp_deadline ? new Date(household.rsvp_deadline) : null;
  const deadlinePassed = deadline ? new Date() > deadline : false;
  const canEdit = !deadlinePassed || Boolean(siteSettings?.late_edits_enabled);

  const invitedSet = useMemo(
    () => new Set(guestEvents.map((ge) => answerKey(ge.guest_id, ge.event_id))),
    [guestEvents]
  );
  const isInvited = (guestId: string, eventId: string) => invitedSet.has(answerKey(guestId, eventId));

  const rsvpGuests = useMemo(
    () => guests.filter((guest) => events.some((event) => isInvited(guest.id, event.id))),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isInvited is derived from guestEvents, already a dep
    [guests, events, guestEvents]
  );

  const [mode, setMode] = useState<"readonly" | "edit">(alreadySubmitted ? "readonly" : "edit");
  const [activeGuestIndex, setActiveGuestIndex] = useState(0);
  const [slideFromLeft, setSlideFromLeft] = useState(false);
  const prevIndexRef = useRef(0);

  const goToGuest = (index: number) => {
    setSlideFromLeft(index < prevIndexRef.current);
    prevIndexRef.current = index;
    setActiveGuestIndex(index);
  };

  const initialAnswers = useMemo(() => {
    const map: Record<string, "yes" | "no"> = {};
    for (const rsvp of existingRsvps) {
      if (rsvp.attending) map[answerKey(rsvp.guest_id, rsvp.event_id)] = rsvp.attending;
    }
    return map;
  }, [existingRsvps]);

  const [answers, setAnswers] = useState(initialAnswers);
  const [dietaryNeeds, setDietaryNeeds] = useState(household.dietary_needs ?? "");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(household.accessibility_needs ?? "");
  const [householdNote, setHouseholdNote] = useState(household.household_note ?? "");
  const [phoneNumbers, setPhoneNumbers] = useState<{ phone_number: string }[]>(
    whatsappNumbers.length > 0
      ? whatsappNumbers.map((n) => ({ phone_number: n.phone_number }))
      : [{ phone_number: "" }]
  );

  const updatePhoneNumber = (index: number, value: string) => {
    setPhoneNumbers((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, phone_number: value } : entry))
    );
  };
  const addPhoneNumber = () =>
    setPhoneNumbers((prev) => (prev.length >= guests.length ? prev : [...prev, { phone_number: "" }]));
  const removePhoneNumber = (index: number) =>
    setPhoneNumbers((prev) => prev.filter((_, i) => i !== index));

  const [state, formAction, pending] = useActionState(submitRsvp, { error: null });

  // Plays the stamp animation once, only on the submission that actually
  // just happened -- a later visit to an already-submitted RSVP shows the
  // stamp already settled, no animation.
  const [stamping, setStamping] = useState(false);
  const stampStarted = useRef(false);
  useEffect(() => {
    if (justSubmitted && !stampStarted.current) {
      stampStarted.current = true;
      setStamping(true);
    }
  }, [justSubmitted]);

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

  const whatsappNumbersArray = phoneNumbers
    .filter((entry) => entry.phone_number.trim())
    .map((entry) => ({ phone_number: entry.phone_number.trim() }));

  return (
    <Section id="rsvp" className="rv-section">
      <div className={cn("rv-ticket", stamping && "rv-impact")}>
        <div className="rv-heading">
          <div>
            <p className="gh-eyebrow">RSVP</p>
            <h2 className="font-heading">Will you join us?</h2>
          </div>
          <p>Reply for everyone in your household. Each event takes one quick yes or no.</p>
        </div>

        <div className="rv-deadline">
          <span>
            Please reply by{" "}
            {household.rsvp_deadline
              ? formatRsvpDeadlineDate(household.rsvp_deadline)
              : "date to be announced"}
          </span>
          <span>
            {alreadySubmitted
              ? "You've responded"
              : deadlinePassed
                ? "RSVP closed"
                : "Reply when you are ready"}
          </span>
        </div>

        {mode === "readonly" ? (
          <div className="rv-confirmation">
            <div className={cn("rv-stamp-stage", stamping && "rv-stamping")}>
              <div className="rv-stamp-tool">
                <span className="rv-stamp-handle" />
                <span className="rv-stamp-base" />
              </div>
              <div className={cn("rv-stamp-mark", !stamping && "rv-settled")}>
                <span>Household</span>
                <strong>RSVP received</strong>
                <small>{household.display_name}</small>
              </div>
              <div className="rv-petals">
                {petalConfigs.map((petal, i) => (
                  <span
                    key={i}
                    style={
                      {
                        "--x": petal.x,
                        "--y": petal.y,
                        "--r": petal.r,
                        "--petal-color": petal.color,
                        "--delay": petal.delay,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            </div>
            <p className="gh-eyebrow">Your response is in</p>
            <h3 className="font-heading text-2xl text-accent-foreground">Stamped and received.</h3>
            <p className="text-sm text-muted-foreground">
              Your answers stay read-only until you choose to make changes.
            </p>

            <div className="rv-people">
              {rsvpGuests.map((guest) => (
                <div key={guest.id} className="rv-person-card">
                  <span className="rv-person-name">
                    {guest.first_name} {guest.last_name}
                  </span>
                  <div className="rv-person-events">
                    {events
                      .filter((event) => isInvited(guest.id, event.id))
                      .map((event) => {
                        const answer = answers[answerKey(guest.id, event.id)];
                        return (
                          <span
                            key={event.id}
                            className={`rv-person-event ${answer === "yes" ? "rv-yes" : "rv-no"}`}
                          >
                            {event.name}
                          </span>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            {canEdit ? (
              <button type="button" className="rv-edit-pill" onClick={() => setMode("edit")}>
                Make changes
              </button>
            ) : null}
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="answers" value={JSON.stringify(answersArray)} />
            <input
              type="hidden"
              name="whatsapp_numbers"
              value={JSON.stringify(whatsappNumbersArray)}
            />

            {rsvpGuests.length > 0 ? (
              <>
                <div className="rv-progress">
                  <strong>
                    Guest {activeGuestIndex + 1} of {rsvpGuests.length}
                  </strong>
                  <div className="rv-dots" role="tablist" aria-label="Choose a guest">
                    {rsvpGuests.map((guest, index) => (
                      <button
                        key={guest.id}
                        type="button"
                        role="tab"
                        aria-selected={index === activeGuestIndex}
                        aria-label={`${guest.first_name} ${guest.last_name}`}
                        onClick={() => goToGuest(index)}
                        className="rv-dot"
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rv-carousel">
                  {activeGuest ? (
                    <div key={activeGuest.id} className={cn("rv-card", slideFromLeft && "rv-from-left")}>
                      <div className="rv-guest-heading">
                        <h3>
                          {activeGuest.first_name} {activeGuest.last_name}
                        </h3>
                      </div>
                      <div className="rv-choice-grid">
                        {events
                          .filter((event) => isInvited(activeGuest.id, event.id))
                          .map((event) => {
                            const key = answerKey(activeGuest.id, event.id);
                            const value = answers[key];
                            return (
                              <div key={event.id} className="rv-choice">
                                <strong>{event.name}</strong>
                                <small>
                                  {formatEventDay(event.event_date)} &middot;{" "}
                                  {formatEventTime(event.start_time)}
                                </small>
                                <div className="rv-yesno" role="group" aria-label={`${activeGuest.first_name} ${event.name} attendance`}>
                                  <button
                                    type="button"
                                    className={cn(value === "yes" && "rv-selected")}
                                    onClick={() => setAnswers((prev) => ({ ...prev, [key]: "yes" }))}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(value === "no" && "rv-selected")}
                                    onClick={() => setAnswers((prev) => ({ ...prev, [key]: "no" }))}
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
                </div>

                <div className="rv-controls">
                  <button
                    type="button"
                    className="rv-nav"
                    disabled={activeGuestIndex === 0}
                    onClick={() => goToGuest(Math.max(0, activeGuestIndex - 1))}
                  >
                    &larr; Previous guest
                  </button>
                  <button
                    type="button"
                    className="rv-nav"
                    disabled={activeGuestIndex === rsvpGuests.length - 1}
                    onClick={() => goToGuest(Math.min(rsvpGuests.length - 1, activeGuestIndex + 1))}
                  >
                    Next guest &rarr;
                  </button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No events found for your household.</p>
            )}

            <div className="rv-end">
              <div className="rv-updates">
                <div className="rv-updates-copy">
                  <p className="gh-eyebrow">Household updates</p>
                  <h4>Stay in the loop.</h4>
                  <p>
                    Add one or more phone numbers to join the WhatsApp group for hotel, schedule,
                    and weekend announcements. Group invites go out closer to the date, so don&apos;t
                    worry if you don&apos;t see anything right away.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {phoneNumbers.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`phone_number_${index}`}>Phone number</Label>
                        <input
                          id={`phone_number_${index}`}
                          type="text"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="(555) 123-4567"
                          value={entry.phone_number}
                          onChange={(event) => updatePhoneNumber(index, event.target.value)}
                        />
                      </div>
                      {phoneNumbers.length > 1 ? (
                        <button
                          type="button"
                          className="rv-edit-pill"
                          onClick={() => removePhoneNumber(index)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {phoneNumbers.length < guests.length ? (
                    <button type="button" className="rv-edit-pill self-start" onClick={addPhoneNumber}>
                      Add another number
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You&apos;ve added a number for every guest on your invitation.
                    </p>
                  )}
                </div>
              </div>

              <div className="rv-needs">
                <div className="rv-needs-copy">
                  <p className="gh-eyebrow">Help us host you well</p>
                  <h4>Meals, access, and anything else we should know.</h4>
                  <p>
                    These notes apply to your household. Please share only what will help us make
                    the weekend comfortable.
                  </p>
                </div>
                <div className="rv-needs-grid">
                  <div className="rv-needs-field">
                    <Label htmlFor="dietary_needs">
                      Dietary restrictions or allergies <small>(optional)</small>
                    </Label>
                    <Textarea
                      id="dietary_needs"
                      name="dietary_needs"
                      value={dietaryNeeds}
                      onChange={(event) => setDietaryNeeds(event.target.value)}
                      placeholder="Allergies, dietary restrictions, or meal considerations"
                    />
                  </div>
                  <div className="rv-needs-field">
                    <Label htmlFor="accessibility_needs">
                      Accessibility or mobility needs <small>(optional)</small>
                    </Label>
                    <Textarea
                      id="accessibility_needs"
                      name="accessibility_needs"
                      value={accessibilityNeeds}
                      onChange={(event) => setAccessibilityNeeds(event.target.value)}
                      placeholder="Mobility, seating, sensory, or other accommodations"
                    />
                  </div>
                  <div className="rv-needs-field">
                    <Label htmlFor="household_note">
                      Please leave a note for the couple! <small>(optional)</small>
                    </Label>
                    <Textarea
                      id="household_note"
                      name="household_note"
                      value={householdNote}
                      onChange={(event) => setHouseholdNote(event.target.value)}
                      placeholder="Well wishes, excitement, or anything you'd like to share with us"
                    />
                  </div>
                </div>
              </div>

              <div className="rv-submit">
                <button type="submit" className="gh-button" disabled={pending}>
                  {pending ? "Submitting..." : "Stamp our RSVP"}
                </button>
                {alreadySubmitted ? (
                  <button
                    type="button"
                    className="gh-button gh-button-secondary"
                    onClick={() => setMode("readonly")}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              {state.error ? <p className="rv-error">{state.error}</p> : null}
            </div>
          </form>
        )}
      </div>
    </Section>
  );
}
