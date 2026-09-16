"use client";

import { useActionState, useState } from "react";
import { saveEvent } from "@/app/actions/admin";
import { parseTraditionList } from "@/lib/parse-admin-lists";
import { EventFlipCards } from "@/components/event-flip-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type WardrobeContent = {
  title?: string;
  description?: string;
  good_to_know?: string;
  palette?: { name: string; hex: string }[];
};

type ItineraryContent = {
  subtitle?: string;
  tradition_intro?: string;
  tradition_list?: { label: string; text: string }[];
};

type Event = {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  address: string | null;
  dress_code: string | null;
  meal_info: string | null;
  description: string | null;
  extra_content: { wardrobe?: WardrobeContent; itinerary?: ItineraryContent } | Record<string, unknown>;
};

// Closes the surfaced US-A6 gap (admins edit event details without a code
// deploy) and doubles as the Wardrobe planner's content editor, since that
// content lives on the same row's extra_content column -- see the
// 2026-09-12 "design integration plan" Decision Log entry.
export function EventDetailsForm({ event }: { event: Event }) {
  const [state, formAction, pending] = useActionState(saveEvent, { error: null });
  const wardrobe = (event.extra_content as { wardrobe?: WardrobeContent })?.wardrobe;
  const paletteText = (wardrobe?.palette ?? [])
    .map((color) => `${color.name}: ${color.hex}`)
    .join("\n");
  const itinerary = (event.extra_content as { itinerary?: ItineraryContent })?.itinerary;
  const traditionListText = (itinerary?.tradition_list ?? [])
    .map((item) => `${item.label}: ${item.text}`)
    .join("\n");

  // Mirrors the fields the itinerary flip-card actually renders, so the
  // preview updates live as the admin types instead of only after saving.
  const [name, setName] = useState(event.name);
  const [eventDate, setEventDate] = useState(event.event_date ?? "");
  const [startTime, setStartTime] = useState(event.start_time ?? "");
  const [endTime, setEndTime] = useState(event.end_time ?? "");
  const [mealInfo, setMealInfo] = useState(event.meal_info ?? "");
  const [subtitle, setSubtitle] = useState(itinerary?.subtitle ?? "");
  const [traditionIntro, setTraditionIntro] = useState(itinerary?.tradition_intro ?? "");
  const [traditionListRaw, setTraditionListRaw] = useState(traditionListText);

  const previewEvent = {
    id: event.id,
    name: name || "Untitled event",
    event_date: eventDate || null,
    start_time: startTime || null,
    end_time: endTime || null,
    meal_info: mealInfo || null,
    description: event.description,
    extra_content: {
      itinerary: {
        subtitle,
        tradition_intro: traditionIntro,
        tradition_list: parseTraditionList(traditionListRaw),
      },
    },
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="event_id" value={event.id} />

      <div className="flex flex-col gap-5">
        <h3 className="av-section-title">Event details</h3>

        <div className="av-field">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="av-field">
            <Label htmlFor="event_date">Date</Label>
            <Input
              id="event_date"
              name="event_date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="av-field">
            <Label htmlFor="start_time">Start time</Label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="av-field">
            <Label htmlFor="end_time">End time</Label>
            <Input
              id="end_time"
              name="end_time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="av-field">
            <Label htmlFor="venue_name">Venue</Label>
            <Input id="venue_name" name="venue_name" defaultValue={event.venue_name ?? ""} />
          </div>
          <div className="av-field">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={event.address ?? ""} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="av-field">
            <Label htmlFor="dress_code">Dress code</Label>
            <Input id="dress_code" name="dress_code" defaultValue={event.dress_code ?? ""} />
          </div>
          <div className="av-field">
            <Label htmlFor="meal_info">Meal</Label>
            <Input
              id="meal_info"
              name="meal_info"
              value={mealInfo}
              onChange={(e) => setMealInfo(e.target.value)}
            />
          </div>
        </div>

        <div className="av-field">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={event.description ?? ""}
            rows={2}
          />
          <p className="av-section-hint">Used as the calendar-download event description.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 border-t border-border pt-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-5">
          <div>
            <h3 className="av-section-title">Itinerary card</h3>
            <p className="av-section-hint">Shown on the flip-card in the Itinerary section.</p>
          </div>

          <div className="av-field">
            <Label htmlFor="itinerary_subtitle">Subtitle</Label>
            <Input
              id="itinerary_subtitle"
              name="itinerary_subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. A bright beginning."
            />
          </div>

          <div className="av-field">
            <Label htmlFor="itinerary_tradition_intro">Tradition</Label>
            <Textarea
              id="itinerary_tradition_intro"
              name="itinerary_tradition_intro"
              value={traditionIntro}
              onChange={(e) => setTraditionIntro(e.target.value)}
              rows={3}
            />
          </div>

          <div className="av-field">
            <Label htmlFor="itinerary_tradition_list">What to expect</Label>
            <Textarea
              id="itinerary_tradition_list"
              name="itinerary_tradition_list"
              value={traditionListRaw}
              onChange={(e) => setTraditionListRaw(e.target.value)}
              rows={4}
              placeholder={"One item per line, as Label: text\ne.g.\nThe atmosphere: Music, laughter, and plenty of yellow."}
            />
            <p className="av-section-hint">One item per line, as &quot;Label: text&quot;.</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div>
            <h3 className="av-section-title">Preview</h3>
            <p className="av-section-hint">Updates live. Select the card to see the back.</p>
          </div>
          <div className="av-preview-grid">
            <EventFlipCards events={[previewEvent]} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 border-t border-border pt-6">
        <div>
          <h3 className="av-section-title">Wardrobe planner</h3>
          <p className="av-section-hint">Shown in the Wardrobe planner section on the wedding site.</p>
        </div>

        <div className="av-field">
          <Label htmlFor="wardrobe_title">Look title</Label>
          <Input
            id="wardrobe_title"
            name="wardrobe_title"
            defaultValue={wardrobe?.title ?? ""}
            placeholder="e.g. Sunny & relaxed"
          />
        </div>

        <div className="av-field">
          <Label htmlFor="wardrobe_description">Outfit suggestions</Label>
          <Textarea
            id="wardrobe_description"
            name="wardrobe_description"
            defaultValue={wardrobe?.description ?? ""}
            rows={2}
          />
        </div>

        <div className="av-field">
          <Label htmlFor="wardrobe_good_to_know">Good to know</Label>
          <Textarea
            id="wardrobe_good_to_know"
            name="wardrobe_good_to_know"
            defaultValue={wardrobe?.good_to_know ?? ""}
            rows={2}
          />
        </div>

        <div className="av-field">
          <Label htmlFor="wardrobe_palette">Suggested palette</Label>
          <Textarea
            id="wardrobe_palette"
            name="wardrobe_palette"
            defaultValue={paletteText}
            rows={4}
            placeholder={"One color per line, as Name: #hexcode\ne.g.\nMarigold: #e1b338\nLeaf green: #75906b"}
          />
          <p className="av-section-hint">One color per line, as &quot;Name: #hexcode&quot;.</p>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save event"}
      </Button>
    </form>
  );
}
