"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { formatEventDayPart, formatEventTime, formatEventWeekday } from "@/lib/format";
import { designAssets } from "@/lib/design-assets";
import "./wardrobe-planner.css";

export type WardrobeContent = {
  title?: string;
  description?: string;
  good_to_know?: string;
  palette?: { name: string; hex: string }[];
};

type Event = {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  extra_content: { wardrobe?: WardrobeContent } | Record<string, unknown>;
};

// Cycled by position, same reasoning as EventFlipCards' accents --
// generalizes regardless of what the admin actually calls each event.
const accentColors = [
  "var(--color-event-haldi)",
  "var(--color-event-sangeet)",
  "var(--color-event-ceremony)",
  "var(--color-event-reception)",
];

// The designer's pencil-illustration PNGs (one per garment pairing:
// Haldi/Sangeet/Ceremony/Reception), cycled by position rather than tied
// to a specific event name for the same reason as accentColors above --
// generic decorative art, not per-couple content, so not admin-editable.
const garmentSketches = [
  { src: designAssets.wardrobeHaldi, alt: "Pencil fashion illustration of a sharara and kurta for the Haldi" },
  { src: designAssets.wardrobeSangeet, alt: "Pencil fashion illustration of a dancing lehenga and embroidered kurta for Sangeet and Garba" },
  { src: designAssets.wardrobeWedding, alt: "Pencil fashion illustration of a South Indian silk saree and sherwani for the wedding ceremony" },
  { src: designAssets.wardrobeReception, alt: "Pencil fashion illustration of formal Indian eveningwear for the reception" },
];

export function WardrobePlanner({ events }: { events: Event[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = events[activeIndex];

  if (!active) return null;

  const select = (index: number, moveFocus: boolean) => {
    const next = (index + events.length) % events.length;
    setActiveIndex(next);
    if (moveFocus) tabRefs.current[next]?.focus({ preventScroll: true });
  };

  // Matches the handoff's attire-tab keydown handler: arrow keys both move
  // focus and activate the tab immediately (roving tabindex, no separate
  // Enter/Space step), same convention as OurStory's dot navigation.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = events.length - 1;
    else return;
    event.preventDefault();
    select(next, true);
  };

  const wardrobe = (active.extra_content as { wardrobe?: WardrobeContent })?.wardrobe;
  const weekday = formatEventWeekday(active.event_date);
  const time = formatEventTime(active.start_time);

  return (
    <div className="wp-explorer">
      <aside className="wp-rail">
        <div className="wp-rail-heading">
          <p className="wp-rail-eyebrow">Wardrobe planner</p>
          <p className="wp-rail-title">The weekend edit</p>
        </div>
        <div
          className="wp-tabs"
          role="tablist"
          aria-label="Wardrobe by event"
          style={{ "--wp-count": events.length } as CSSProperties}
        >
          {events.map((event, index) => (
            <button
              key={event.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              tabIndex={index === activeIndex ? 0 : -1}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              onClick={() => select(index, false)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className="wp-tab"
              style={{ "--wp-tab-color": accentColors[index % accentColors.length] } as CSSProperties}
            >
              <span className="wp-tab-head">
                <span className="wp-tab-daypart">{formatEventDayPart(event.event_date, event.start_time)}</span>
                <span className="wp-tab-look">Look {String(index + 1).padStart(2, "0")}</span>
              </span>
              <strong>{event.name}</strong>
            </button>
          ))}
        </div>
      </aside>

      <div className="wp-detail" key={active.id}>
        <div className="wp-panel-inner">
          <div className="wp-copy">
            <p className="gh-eyebrow" style={{ color: accentColors[activeIndex % accentColors.length] } as CSSProperties}>
              {active.name}
            </p>
            <h3 className="font-heading">{wardrobe?.title || "Dress code coming soon"}</h3>
            {weekday && time ? <p className="wp-time">{weekday}, {time}</p> : null}
            {wardrobe?.description ? <p>{wardrobe.description}</p> : null}
            {wardrobe?.good_to_know ? (
              <div className="wp-note">
                <strong>Good to know</strong>
                <span>{wardrobe.good_to_know}</span>
              </div>
            ) : null}
          </div>

          <div
            className="wp-visual"
            style={{ "--wp-wash": accentColors[activeIndex % accentColors.length] } as CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative art on an external Supabase Storage host, not worth Next/Image's config surface for four static files */}
            <img
              className="wp-sketch"
              src={garmentSketches[activeIndex % garmentSketches.length].src}
              alt={garmentSketches[activeIndex % garmentSketches.length].alt}
            />
            {wardrobe?.palette && wardrobe.palette.length > 0 ? (
              <div className="wp-palette">
                <p className="wp-palette-label">Suggested palette</p>
                <div className="wp-swatches" aria-label={`${active.name} color palette`}>
                  {wardrobe.palette.map((color) => (
                    <div key={color.hex} className="wp-swatch-item">
                      <span className="wp-swatch" style={{ background: color.hex }} />
                      <span className="wp-swatch-name">{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
