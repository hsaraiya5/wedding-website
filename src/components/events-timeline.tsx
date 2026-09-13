"use client";

import { useState, type CSSProperties } from "react";
import { formatEventDay, formatEventDayFull, formatEventTime } from "@/lib/format";
import "./events-timeline.css";

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

  const trackFill =
    events.length > 1 ? `${(activeIndex / (events.length - 1)) * 75 + 12.5}%` : "12.5%";

  return (
    <div>
      <div className="tl-shell">
        <div
          className="tl-track"
          role="tablist"
          aria-label="Wedding weekend events"
          style={{ gridTemplateColumns: `repeat(${events.length}, minmax(0, 1fr))` } as CSSProperties}
        >
          <span className="tl-progress" style={{ width: trackFill }} aria-hidden="true" />
          {events.map((event, index) => {
            const accent = accentColors[index % accentColors.length];
            return (
              <button
                key={event.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className="tl-stop"
                style={{ "--tl-color": accent } as CSSProperties}
              >
                <span className="tl-stop-day">{formatEventDay(event.event_date)}</span>
                <span className="tl-dot" aria-hidden="true" />
                <span className="tl-stop-time">{formatEventTime(event.start_time)}</span>
                <strong>{event.name}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <article className="tl-detail" key={active.id}>
        <div>
          <p className="tl-detail-eyebrow text-xs font-bold uppercase tracking-wide">
            {formatEventDayFull(active.event_date)}
          </p>
          <h3 className="font-heading">{active.name}</h3>
          {active.description ? <p className="tl-detail-copy">{active.description}</p> : null}
        </div>

        <dl className="tl-facts">
          <div>
            <dt>Time</dt>
            <dd>
              {formatEventTime(active.start_time)}
              {active.end_time ? ` to ${formatEventTime(active.end_time)}` : ""}
            </dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{active.venue_name || "Coming soon"}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{active.address || "Coming soon"}</dd>
          </div>
          <div>
            <dt>Meal</dt>
            <dd>{active.meal_info || "Coming soon"}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
