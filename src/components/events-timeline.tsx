"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatEventDay, formatEventDayFull, formatEventTime } from "@/lib/format";

type Event = {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  address: string | null;
  meal_info: string | null;
  description: string | null;
};

// Cycled by position rather than matched by name -- generalizes regardless
// of what the admin actually calls each event.
const accentColors = [
  "var(--color-event-haldi)",
  "var(--color-event-sangeet)",
  "var(--color-event-ceremony)",
  "var(--color-event-reception)",
];

export function EventsTimeline({ events }: { events: Event[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = events[activeIndex];

  if (!active) return null;

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Wedding weekend events"
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {events.map((event, index) => {
          const accent = accentColors[index % accentColors.length];
          const isActive = index === activeIndex;
          return (
            <button
              key={event.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveIndex(index)}
              style={{ borderColor: isActive ? accent : undefined }}
              className={cn(
                "flex min-w-[9rem] flex-col items-start gap-1 rounded-lg border-2 border-transparent bg-card px-4 py-3 text-left transition-colors",
                isActive ? "shadow-sm" : "opacity-70 hover:opacity-100"
              )}
            >
              <span className="text-xs text-muted-foreground">
                {formatEventDay(event.event_date)}
              </span>
              <span className="text-xs font-semibold" style={{ color: accent }}>
                {formatEventTime(event.start_time)}
              </span>
              <strong className="font-heading text-base leading-tight">{event.name}</strong>
            </button>
          );
        })}
      </div>

      <article
        className="rounded-lg border-l-4 bg-card p-6"
        style={{ borderLeftColor: accentColors[activeIndex % accentColors.length] }}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          {formatEventDayFull(active.event_date)}
        </p>
        <h3 className="font-heading text-2xl">{active.name}</h3>
        {active.description ? (
          <p className="mt-2 text-muted-foreground">{active.description}</p>
        ) : null}

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Time</dt>
            <dd>
              {formatEventTime(active.start_time)}
              {active.end_time ? ` to ${formatEventTime(active.end_time)}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Venue</dt>
            <dd>{active.venue_name || "Coming soon"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Address</dt>
            <dd>{active.address || "Coming soon"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Meal</dt>
            <dd>{active.meal_info || "Coming soon"}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
