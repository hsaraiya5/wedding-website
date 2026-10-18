"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { designAssets } from "@/lib/design-assets";
import { rowMatchedHeight, type FlipMeasure } from "@/lib/flip-heights";
import { renderAnswer } from "@/components/faq-section";
import "./hotel-flip-cards.css";

export type HotelOption = {
  id: string;
  type: "hotel-block" | "other-hotel" | "transport";
  name: string;
  label: string | null;
  description: string | null;
  room_types: string | null;
  address: string | null;
  map_link: string | null;
  booking_link: string | null;
  parking_info: string | null;
  distance_from_venue: string | null;
  checkin_time: string | null;
  checkout_time: string | null;
};

type HotelDesign = {
  match: RegExp;
  art: { src: string; alt: string };
  // Sits beside room types on the back.
  fact: { label: string; value: string };
  // The parking cost a driver checks first, beside the Parking heading.
  parkingPrice: { amount: string; unit: string };
};

// There are only ever these two hotels, so each back is designed for its
// hotel rather than templated: the drawing, the fact that matters most (the
// Wyndham is the venue, so it gets no distance), and the parking price.
// Matched on the hotel's name; the editable text (address, description, room
// types, parking notes, links) still comes from the admin Travel page. A
// hotel with no match gets a plain card from those fields alone.
const hotelDesigns: HotelDesign[] = [
  {
    match: /wyndham/i,
    art: {
      src: designAssets.hotelWyndham,
      alt: "Pencil drawing of the Wyndham Grand Pittsburgh Downtown tower",
    },
    fact: { label: "Events", value: "All in this hotel" },
    parkingPrice: { amount: "$44", unit: "valet / night" },
  },
  {
    match: /\beven\b/i,
    art: {
      src: designAssets.hotelEven,
      alt: "Pencil drawing of the EVEN Hotel Pittsburgh Downtown building",
    },
    fact: { label: "To the venue", value: "0.5 miles, with shuttle" },
    parkingPrice: { amount: "$30", unit: "self-park / day" },
  },
];

// Plain flat cards with a click-to-flip: the front is the hotel's drawing and
// name, the back holds every detail. Any number can be open at once (so both
// backs can be compared side by side), and cards in a row share a height --
// see rowMatchedHeight.
export function HotelFlipCards({ options }: { options: HotelOption[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const backRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const frontContentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const backContentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [heights, setHeights] = useState<Record<string, FlipMeasure>>({});
  const ids = options.map((option) => option.id);

  useEffect(() => {
    const measure = () => {
      const next: Record<string, FlipMeasure> = {};
      for (const option of options) {
        const front = frontContentRefs.current[option.id]?.offsetHeight ?? 0;
        const back = backContentRefs.current[option.id]?.offsetHeight ?? 0;
        const top = cardRefs.current[option.id]?.offsetTop ?? 0;
        if (front) next[option.id] = { front, back, top };
      }
      setHeights(next);
    };
    measure();
    // Text rewraps at every width (and the column count changes), so the
    // heights are only right until the next resize -- re-measure whenever
    // either face's content changes size.
    const observer = new ResizeObserver(measure);
    for (const option of options) {
      const front = frontContentRefs.current[option.id];
      const back = backContentRefs.current[option.id];
      if (front) observer.observe(front);
      if (back) observer.observe(back);
    }
    return () => observer.disconnect();
  }, [options]);

  const openCard = (key: string) => {
    setOpenIds((previous) => new Set(previous).add(key));
    window.setTimeout(() => backRefs.current[key]?.focus({ preventScroll: true }), 420);
  };

  const closeCard = (key: string, restoreFocus: boolean) => {
    setOpenIds((previous) => {
      const next = new Set(previous);
      next.delete(key);
      return next;
    });
    if (restoreFocus) triggerRefs.current[key]?.focus({ preventScroll: true });
  };

  const handleBackClick = (event: MouseEvent<HTMLDivElement>, key: string) => {
    if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    closeCard(key, true);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>, key: string) => {
    if (event.key === "Escape" && openIds.has(key)) {
      event.preventDefault();
      closeCard(key, true);
    }
  };

  return (
    <div className="hf-grid">
      {options.map((option) => {
        const isOpen = openIds.has(option.id);
        const backId = `hf-back-${option.id}`;
        const design = hotelDesigns.find((entry) => entry.match.test(option.name));
        const art = design?.art;
        const facts = [
          { label: "Room types", value: option.room_types || "Coming soon" },
          design
            ? design.fact
            : option.distance_from_venue
              ? { label: "Distance from venue", value: option.distance_from_venue }
              : null,
        ].filter((fact): fact is { label: string; value: string } => fact !== null);

        return (
          <article
            key={option.id}
            className={`hf-flip ${isOpen ? "hf-flipped" : ""}`.trim()}
            onKeyDown={(e) => handleCardKeyDown(e, option.id)}
            ref={(node) => {
              cardRefs.current[option.id] = node;
            }}
          >
            <div className="hf-inner" style={{ height: rowMatchedHeight(option.id, ids, heights, openIds) }}>
              <div className="hf-face hf-front">
                <button
                  type="button"
                  className="hf-trigger"
                  aria-label={`Open ${option.name} details`}
                  aria-expanded={isOpen}
                  aria-controls={backId}
                  ref={(node) => {
                    triggerRefs.current[option.id] = node;
                  }}
                  onClick={() => openCard(option.id)}
                />
                <div
                  className="hf-front-content"
                  ref={(node) => {
                    frontContentRefs.current[option.id] = node;
                  }}
                >
                  {art ? (
                    <div className="hf-art">
                      <Image
                        src={art.src}
                        alt={art.alt}
                        width={1200}
                        height={800}
                        sizes="(max-width: 700px) 100vw, 560px"
                      />
                    </div>
                  ) : null}
                  <div className="hf-front-title">
                    <div className="hf-hotel-copy">
                      {option.label ? <p className="gh-eyebrow">{option.label}</p> : null}
                      <h3 className="font-heading">{option.name}</h3>
                    </div>
                    <span className="hf-flip-hint" aria-hidden="true">
                      Flip for details
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="hf-face hf-back"
                id={backId}
                aria-hidden={!isOpen}
                tabIndex={isOpen ? 0 : -1}
                aria-label={`${option.name} details. Select the card to return to the overview.`}
                ref={(node) => {
                  backRefs.current[option.id] = node;
                }}
                onClick={(e) => handleBackClick(e, option.id)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                    e.preventDefault();
                    closeCard(option.id, true);
                  }
                }}
              >
                <div
                  className="hf-back-content"
                  ref={(node) => {
                    backContentRefs.current[option.id] = node;
                  }}
                >
                  <div className="hf-hotel-copy">
                    {option.label ? <p className="gh-eyebrow">{option.label}</p> : null}
                    <h3 className="font-heading">{option.name}</h3>
                    {option.address ? <p className="hf-address">{option.address}</p> : null}
                    {option.description ? <p className="hf-description">{option.description}</p> : null}
                  </div>
                  <dl className={`hf-facts ${facts.length === 1 ? "hf-facts-single" : ""}`.trim()}>
                    {facts.map((fact) => (
                      <div key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {option.parking_info || design ? (
                    <section className="hf-parking" aria-label="Parking">
                      <div className="hf-parking-head">
                        <h4 className="font-heading">Parking</h4>
                        {design ? (
                          <span className="hf-parking-price">
                            <strong>{design.parkingPrice.amount}</strong>
                            <span>{design.parkingPrice.unit}</span>
                          </span>
                        ) : null}
                      </div>
                      <div className="hf-parking-body">
                        {option.parking_info ? renderAnswer(option.parking_info) : <p>Details coming soon.</p>}
                      </div>
                    </section>
                  ) : null}
                  <div className="hf-links">
                    {option.booking_link ? (
                      <a className="hf-book-link" href={option.booking_link} target="_blank" rel="noopener noreferrer">
                        Book your room &#8594;
                      </a>
                    ) : (
                      <span className="hf-book-link hf-book-link-disabled">Booking link coming soon</span>
                    )}
                    {option.map_link ? (
                      <a className="hf-map-link" href={option.map_link} target="_blank" rel="noopener noreferrer">
                        View on map &#8594;
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
